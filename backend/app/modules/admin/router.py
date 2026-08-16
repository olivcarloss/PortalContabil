from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_admin, get_current_user
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

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select nome, cliente_id, is_admin from usuarios_portal where id = %s;",
            (user.id,),
        )
        row = cur.fetchone()
    return {
        "id": user.id,
        "email": user.email,
        "nome": row["nome"] if row else None,
        "cliente_id": str(row["cliente_id"]) if row else None,
        "is_admin": bool(row and row["is_admin"]),
    }


@router.get("/overview", response_model=Overview)
def overview(_: CurrentUser = Depends(get_current_admin)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select count(*) as n, count(*) filter (where ativo) as ativos from clientes;")
        clientes_row = cur.fetchone()

        cur.execute("select count(*) as n from cnpjs;")
        total_cnpjs = cur.fetchone()["n"]

        cur.execute(
            "select count(*) as n, "
            "coalesce(sum(valor_total) filter (where periodicidade = 'mensal'), 0) as mrr "
            "from licencas where status = 'ativa';"
        )
        lic_row = cur.fetchone()

        cur.execute("select count(*) as n from usuarios_portal where ativo;")
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
            group by p.id, p.nome, p.categoria
            order by mrr desc, p.nome;
            """
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
            group by cl.id, cl.nome, cl.ativo
            order by cl.nome;
            """
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
            group by cn.id, cn.cliente_id, cl.nome, cn.cnpj, cn.razao_social, cn.ativo
            order by cl.nome, cn.razao_social;
            """
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
            )
            group by c.status
            order by c.status;
            """
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
            join conciliacoes c on c.cnpj_id = l.cnpj_id
            where p.codigo = 'CONCILIACAO_CONTABIL'
            group by p.id, p.nome;
            """,
            {"finalizados": list(FINALIZADO_STATUSES)},
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
    _: CurrentUser = Depends(get_current_admin),
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

    where_clause = f"where {' and '.join(filters)}" if filters else ""

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"select * from vw_conciliacoes_sintetico {where_clause} "
            "order by ano desc, mes desc, cliente_nome;",
            params,
        )
        return cur.fetchall()


@router.get("/conciliacoes/{conciliacao_id}/lancamentos", response_model=list[LancamentoAnalitico])
def list_all_lancamentos(conciliacao_id: UUID, _: CurrentUser = Depends(get_current_admin)):
    with get_conn() as conn, conn.cursor() as cur:
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
