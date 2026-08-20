from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_user
from app.modules.licensing.escopo import get_escopo, get_usuario_cliente_id
from app.modules.licensing.menus import (
    MENU_ADMIN_CONCILIACAO,
    MENU_ADMIN_VISAO_GERAL,
    get_menus_liberados,
    require_menu,
)
from app.modules.licensing.renovacao import renovar_licencas_vencidas
from app.schemas.accounting import (
    ConciliacaoSintetico,
    LancamentoAnalitico,
    Overview,
    OverviewCliente,
    OverviewCnpj,
    OverviewProduto,
    OverviewProdutoStatus,
    OverviewStatusConciliacao,
)

FINALIZADO_STATUSES = ("concluida", "concluída", "finalizada", "finalizado")

ADMIN_ESCRITORIO_NOME = "IA-Cloude — Administração"
ADMIN_CNPJ = "99999999999999"

router = APIRouter(prefix="/admin", tags=["admin"])


def _ensure_admin_escritorio(cur) -> str:
    """Garante que exista um escritorio + CNPJ administrativos (placeholder,
    CNPJ 99.999.999/9999-99) para o usuario master poder operar mesmo sem
    nenhum cliente real cadastrado. Idempotente: recria o que faltar, sem
    duplicar o que ja existe. Chamado a cada /me para se autocurar caso
    algum desses registros seja apagado do banco."""
    cur.execute("select id from clientes where nome = %s;", (ADMIN_ESCRITORIO_NOME,))
    row = cur.fetchone()
    if row is None:
        cur.execute(
            "insert into clientes (nome, ativo, interno) values (%s, true, true) returning id;",
            (ADMIN_ESCRITORIO_NOME,),
        )
        row = cur.fetchone()
    cliente_id = str(row["id"])

    cur.execute("select 1 from cnpjs where cnpj = %s;", (ADMIN_CNPJ,))
    if cur.fetchone() is None:
        cur.execute(
            "insert into cnpjs (cliente_id, cnpj, razao_social, ativo) "
            "values (%s, %s, %s, true);",
            (cliente_id, ADMIN_CNPJ, ADMIN_ESCRITORIO_NOME),
        )
    return cliente_id


def _clientes_permitidos(conn, usuario_id: str) -> list[str] | None:
    """None = sem filtro (master, ve tudo). Administrador fica restrito aos
    escritorios que administra; usuario comum, so ao proprio escritorio.
    Usado para escopar One Page de Produtos e Conciliacao (admin), que sao
    telas de menu concedido por perfil — nao exclusivas de master — mas
    antes agregavam a plataforma inteira sem checar o papel de quem pediu."""
    papel, escopo = get_escopo(conn, usuario_id)
    if papel == "master":
        return None
    if papel == "administrador":
        return list(escopo)
    proprio = get_usuario_cliente_id(conn, usuario_id)
    return [proprio] if proprio else []


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        admin_cliente_id = _ensure_admin_escritorio(cur)

        cur.execute(
            "select nome, cliente_id, papel from usuarios_portal where id = %s;",
            (user.id,),
        )
        row = cur.fetchone()

        if (
            row is None
            and settings.master_seed_email
            and user.email == settings.master_seed_email
        ):
            # Recuperacao: se usuarios_portal foi zerada (ou este e o
            # primeiro acesso do e-mail semente), o master sempre reganha
            # acesso sozinho, sem depender de alguem rodar SQL manual.
            cur.execute(
                "insert into usuarios_portal (id, cliente_id, nome, papel, ativo) "
                "values (%s, %s, %s, 'master', true) "
                "returning nome, cliente_id, papel;",
                (user.id, admin_cliente_id, "Administrador IA-Cloude"),
            )
            row = cur.fetchone()

        conn.commit()

        menus = get_menus_liberados(conn, user.id)
        escritorios_administrados: list[str] = []
        if row and row["papel"] == "administrador":
            cur.execute(
                "select cliente_id from administrador_clientes where usuario_id = %s;",
                (user.id,),
            )
            escritorios_administrados = [str(r["cliente_id"]) for r in cur.fetchall()]
    return {
        "id": user.id,
        "email": user.email,
        "nome": row["nome"] if row else None,
        "cliente_id": str(row["cliente_id"]) if row else None,
        "papel": row["papel"] if row else "usuario",
        "escritorios_administrados": escritorios_administrados,
        "menus": sorted(menus),
    }


@router.get("/overview", response_model=Overview)
def overview(user: CurrentUser = Depends(require_menu(MENU_ADMIN_VISAO_GERAL))):
    with get_conn() as conn, conn.cursor() as cur:
        renovar_licencas_vencidas(conn)
        cids = _clientes_permitidos(conn, user.id)

        cur.execute(
            "select count(*) as n, count(*) filter (where ativo) as ativos "
            "from clientes "
            "where not interno and (%(cids)s::uuid[] is null or id = any(%(cids)s::uuid[]));",
            {"cids": cids},
        )
        clientes_row = cur.fetchone()

        cur.execute(
            "select count(*) as n from cnpjs cn join clientes cl on cl.id = cn.cliente_id "
            "where not cl.interno and (%(cids)s::uuid[] is null or cl.id = any(%(cids)s::uuid[]));",
            {"cids": cids},
        )
        total_cnpjs = cur.fetchone()["n"]

        cur.execute(
            "select count(*) as n, "
            "coalesce(sum(valor_total) filter (where periodicidade = 'mensal'), 0) as mrr "
            "from licencas "
            "where status = 'ativa' and (%(cids)s::uuid[] is null or cliente_id = any(%(cids)s::uuid[]));",
            {"cids": cids},
        )
        lic_row = cur.fetchone()

        cur.execute(
            "select count(*) as n from usuarios_portal "
            "where ativo and (%(cids)s::uuid[] is null or cliente_id = any(%(cids)s::uuid[]));",
            {"cids": cids},
        )
        usuarios_ativos = cur.fetchone()["n"]

        cur.execute(
            """
            select
                p.id as produto_id,
                p.nome as produto_nome,
                p.categoria,
                count(distinct l.cliente_id) filter (where l.status = 'ativa') as clientes_licenciados,
                count(*) filter (where l.status = 'ativa') as licencas_ativas,
                coalesce(sum(l.valor_total) filter (where l.status = 'ativa' and l.periodicidade = 'mensal'), 0) as mrr
            from produtos p
            left join licencas l on l.produto_id = p.id
                and (%(cids)s::uuid[] is null or l.cliente_id = any(%(cids)s::uuid[]))
            group by p.id, p.nome, p.categoria
            order by mrr desc, p.nome;
            """,
            {"cids": cids},
        )
        por_produto = cur.fetchall()

        cur.execute(
            """
            select
                cl.id as cliente_id,
                cl.nome as cliente_nome,
                cl.ativo,
                count(distinct cn.id) as total_cnpjs,
                coalesce(array_agg(distinct p.nome) filter (where l.status = 'ativa'), '{}') as produtos_ativos,
                count(*) filter (where l.status = 'ativa') as licencas_ativas,
                coalesce(sum(l.valor_total) filter (where l.status = 'ativa' and l.periodicidade = 'mensal'), 0) as mrr
            from clientes cl
            left join cnpjs cn on cn.cliente_id = cl.id
            left join licencas l on l.cliente_id = cl.id
            left join produtos p on p.id = l.produto_id
            where not cl.interno
                and (%(cids)s::uuid[] is null or cl.id = any(%(cids)s::uuid[]))
            group by cl.id, cl.nome, cl.ativo
            order by cl.nome;
            """,
            {"cids": cids},
        )
        por_cliente = cur.fetchall()

        cur.execute(
            """
            select
                cn.id as cnpj_id,
                cn.cliente_id,
                cl.nome as cliente_nome,
                cn.cnpj,
                cn.razao_social,
                cn.ativo,
                coalesce(array_agg(distinct p.nome) filter (where l.status = 'ativa'), '{}') as produtos_ativos,
                coalesce(sum(l.valor_total) filter (where l.status = 'ativa' and l.periodicidade = 'mensal'), 0) as mrr
            from cnpjs cn
            join clientes cl on cl.id = cn.cliente_id
            left join licencas l on (l.cnpj_id = cn.id) or (l.cnpj_id is null and l.cliente_id = cn.cliente_id)
            left join produtos p on p.id = l.produto_id
            where not cl.interno
                and (%(cids)s::uuid[] is null or cl.id = any(%(cids)s::uuid[]))
            group by cn.id, cn.cliente_id, cl.nome, cn.cnpj, cn.razao_social, cn.ativo
            order by cl.nome, cn.razao_social;
            """,
            {"cids": cids},
        )
        por_cnpj = cur.fetchall()

        # Escopo: apenas conciliacoes de CNPJs com licenca ATIVA do produto de
        # Conciliacao Contabil ("status considerado dentro do produto ativado").
        cur.execute(
            """
            select c.status, count(*) as total
            from conciliacoes c
            where c.cnpj_id in (
                select l.cnpj_id from licencas l
                join produtos p on p.id = l.produto_id
                where p.codigo = 'CONCILIACAO_CONTABIL' and l.status = 'ativa'
                    and (%(cids)s::uuid[] is null or l.cliente_id = any(%(cids)s::uuid[]))
            )
            group by c.status
            order by c.status;
            """,
            {"cids": cids},
        )
        status_conciliacoes = cur.fetchall()

        cur.execute(
            """
            select
                p.id as produto_id,
                p.nome as produto_nome,
                count(*) filter (where lower(c.status) = any(%(finalizados)s)) as finalizados,
                count(*) filter (where lower(c.status) <> all(%(finalizados)s)) as nao_finalizados
            from produtos p
            join licencas l on l.produto_id = p.id and l.status = 'ativa'
                and (%(cids)s::uuid[] is null or l.cliente_id = any(%(cids)s::uuid[]))
            join conciliacoes c on c.cnpj_id = l.cnpj_id
            where p.codigo = 'CONCILIACAO_CONTABIL'
            group by p.id, p.nome;
            """,
            {"finalizados": list(FINALIZADO_STATUSES), "cids": cids},
        )
        status_por_produto = cur.fetchall()

    return Overview(
        total_clientes=clientes_row["n"],
        clientes_ativos=clientes_row["ativos"],
        total_cnpjs=total_cnpjs,
        total_licencas_ativas=lic_row["n"],
        mrr_total=float(lic_row["mrr"]),
        total_usuarios_ativos=usuarios_ativos,
        por_produto=[OverviewProduto(**row) for row in por_produto],
        por_cliente=[OverviewCliente(**row) for row in por_cliente],
        por_cnpj=[OverviewCnpj(**row) for row in por_cnpj],
        status_conciliacoes=[OverviewStatusConciliacao(**row) for row in status_conciliacoes],
        status_por_produto=[OverviewProdutoStatus(**row) for row in status_por_produto],
    )


@router.get("/conciliacoes", response_model=list[ConciliacaoSintetico])
def list_all_conciliacoes(
    cliente_id: UUID | None = None,
    cnpj_id: UUID | None = None,
    ano: int | None = None,
    mes: int | None = None,
    status: str | None = None,
    user: CurrentUser = Depends(require_menu(MENU_ADMIN_CONCILIACAO)),
):
    filters = []
    params: dict = {}
    if cliente_id:
        filters.append("cliente_id = %(cliente_id)s")
        params["cliente_id"] = str(cliente_id)
    if cnpj_id:
        filters.append("cnpj_id = %(cnpj_id)s")
        params["cnpj_id"] = str(cnpj_id)
    if ano:
        filters.append("ano = %(ano)s")
        params["ano"] = ano
    if mes:
        filters.append("mes = %(mes)s")
        params["mes"] = mes
    if status:
        filters.append("status = %(status)s")
        params["status"] = status

    with get_conn() as conn, conn.cursor() as cur:
        cids = _clientes_permitidos(conn, user.id)
        if cids is not None:
            filters.append("cliente_id = any(%(cids)s::uuid[])")
            params["cids"] = cids

        where_clause = f"where {' and '.join(filters)}" if filters else ""
        cur.execute(
            f"select * from vw_conciliacoes_sintetico {where_clause} "
            "order by ano desc, mes desc, cliente_nome;",
            params,
        )
        return cur.fetchall()


@router.get("/conciliacoes/{conciliacao_id}/lancamentos", response_model=list[LancamentoAnalitico])
def list_all_lancamentos(
    conciliacao_id: UUID, user: CurrentUser = Depends(require_menu(MENU_ADMIN_CONCILIACAO))
):
    with get_conn() as conn, conn.cursor() as cur:
        cids = _clientes_permitidos(conn, user.id)
        if cids is not None:
            cur.execute(
                """
                select 1 from conciliacoes c
                join cnpjs cn on cn.id = c.cnpj_id
                where c.id = %s and cn.cliente_id = any(%s::uuid[]);
                """,
                (conciliacao_id, cids),
            )
            if cur.fetchone() is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem acesso a esta conciliacao")

        cur.execute(
            """
            select v.* from vw_lancamentos_analitico v
            join lancamentos l on l.id = v.lancamento_id
            where l.conciliacao_id = %s
            order by v.data_lancamento;
            """,
            (conciliacao_id,),
        )
        return cur.fetchall()
