from datetime import date
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status

from app.core import supabase_admin
from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_user
from app.modules.licensing.escopo import (
    get_escopo,
    get_usuario_cliente_id,
    require_escopo_cliente,
    require_papel_master,
)
from app.modules.licensing.menus import (
    MENU_LICENCIAMENTO_ESCRITORIOS,
    MENU_LICENCIAMENTO_PERFIS,
    MENU_LICENCIAMENTO_PRODUTOS,
    MENU_LICENCIAMENTO_USUARIOS,
    MENU_LICENCIAMENTO_VISAO_GERAL,
    MENU_RELATORIO_CLIENTES,
    MENU_RELATORIO_ESCRITORIOS,
    MENU_RELATORIO_PRODUTOS,
    MENU_RELATORIO_TABELA_PRECOS,
    require_menu,
)
from app.modules.licensing.renovacao import renovar_licencas_vencidas

# Qualquer usuario com acesso a alguma tela do Portal de Licenciamento pode
# ler catalogos de referencia (produtos, clientes, perfis, licencas) — sao
# usados para cross-reference entre telas (ex.: Escritorios mostra nome do
# produto de cada licenca). As MUTACOES continuam restritas ao menu
# especifico daquele recurso.
_QUALQUER_MENU_LICENCIAMENTO = (
    MENU_LICENCIAMENTO_VISAO_GERAL,
    MENU_LICENCIAMENTO_PRODUTOS,
    MENU_LICENCIAMENTO_ESCRITORIOS,
    MENU_LICENCIAMENTO_USUARIOS,
    MENU_LICENCIAMENTO_PERFIS,
)
from app.schemas.licensing import (
    Cliente,
    ClienteCreate,
    ClienteUpdate,
    Cnpj,
    CnpjCreate,
    CnpjUpdate,
    EscritoriosAdministradosUpdate,
    Licenca,
    LicencaCreate,
    LicencaUpdate,
    ModulosUsuarioUpdate,
    Modulo,
    ModuloCreate,
    ModuloUpdate,
    PerfilAcesso,
    PerfilAcessoCreate,
    PerfilAcessoUpdate,
    Produto,
    ProdutoCreate,
    ProdutoUpdate,
    UsuarioConviteCreate,
    UsuarioLicenca,
    UsuarioLicencaCreate,
    UsuarioPortal,
    UsuarioPortalUpdate,
)

router = APIRouter(prefix="/licensing", tags=["licensing"])


def _um_ano_apos(d: date) -> date:
    try:
        return d.replace(year=d.year + 1)
    except ValueError:
        # 29/fev sem ano bissexto correspondente
        return d.replace(month=2, day=28, year=d.year + 1)


# ============================================================
# Produtos
# ============================================================
@router.get("/produtos", response_model=list[Produto])
def list_produtos(
    _: CurrentUser = Depends(require_menu(*_QUALQUER_MENU_LICENCIAMENTO, MENU_RELATORIO_TABELA_PRECOS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select * from produtos order by ativo desc, nome;")
        return cur.fetchall()


@router.post("/produtos", response_model=Produto, status_code=status.HTTP_201_CREATED)
def create_produto(
    payload: ProdutoCreate, _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS))
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into produtos (codigo, nome, descricao, categoria, escopo_licenca, ativo)
            values (%(codigo)s, %(nome)s, %(descricao)s, %(categoria)s, %(escopo_licenca)s, %(ativo)s)
            returning *;
            """,
            payload.model_dump(),
        )
        row = cur.fetchone()
        conn.commit()
        return row


@router.patch("/produtos/{produto_id}", response_model=Produto)
def update_produto(
    produto_id: UUID,
    payload: ProdutoUpdate,
    _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)),
):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(produto_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"update produtos set {set_clause} where id = %(id)s returning *;", fields
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Produto nao encontrado")
        conn.commit()
        return row


@router.delete("/produtos/{produto_id}", status_code=status.HTTP_200_OK)
def delete_produto(
    produto_id: UUID, _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS))
):
    """Tenta excluir definitivamente o produto (só é possível se nunca teve
    nenhuma licença). Se houver licenças (mesmo canceladas) referenciando o
    produto, inativa (soft delete) em vez de apagar o histórico."""
    with get_conn() as conn, conn.cursor() as cur:
        try:
            cur.execute("delete from produtos where id = %s returning id;", (produto_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Produto nao encontrado")
            conn.commit()
            return {"deleted": True, "inativado": False}
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            cur.execute(
                "update produtos set ativo = false where id = %s returning id;",
                (produto_id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Produto nao encontrado")
            conn.commit()
            return {"deleted": False, "inativado": True}


@router.get("/produtos/{produto_id}/modulos", response_model=list[Modulo])
def list_modulos(
    produto_id: UUID,
    _: CurrentUser = Depends(require_menu(*_QUALQUER_MENU_LICENCIAMENTO, MENU_RELATORIO_TABELA_PRECOS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select * from modulos where produto_id = %s order by nome;", (produto_id,)
        )
        return cur.fetchall()


@router.post(
    "/produtos/{produto_id}/modulos", response_model=Modulo, status_code=status.HTTP_201_CREATED
)
def create_modulo(
    produto_id: UUID,
    payload: ModuloCreate,
    _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into modulos (produto_id, codigo, nome, descricao, valor_execucao, ativo)
            values (%(produto_id)s, %(codigo)s, %(nome)s, %(descricao)s, %(valor_execucao)s, %(ativo)s)
            returning *;
            """,
            {**payload.model_dump(), "produto_id": str(produto_id)},
        )
        row = cur.fetchone()
        conn.commit()
        return row


@router.patch("/modulos/{modulo_id}", response_model=Modulo)
def update_modulo(
    modulo_id: UUID,
    payload: ModuloUpdate,
    _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)),
):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(modulo_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"update modulos set {set_clause} where id = %(id)s returning *;", fields
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Modulo nao encontrado")

        if "valor_execucao" in fields:
            # O valor de uma licenca e sempre a soma dos modulos habilitados
            # nela (nunca digitado manualmente) — se o preco de um modulo
            # muda, toda licenca que o usa precisa ser recalculada, senao
            # o valor_total fica congelado com o preco antigo.
            cur.execute(
                """
                update licencas l
                set valor_unitario = sub.total,
                    valor_total = sub.total * l.qtd_licencas
                from (
                    select lm.licenca_id, coalesce(sum(m.valor_execucao), 0) as total
                    from licenca_modulos lm
                    join modulos m on m.id = lm.modulo_id
                    where lm.licenca_id in (
                        select licenca_id from licenca_modulos where modulo_id = %(id)s
                    )
                    group by lm.licenca_id
                ) sub
                where l.id = sub.licenca_id;
                """,
                {"id": fields["id"]},
            )

        conn.commit()
        return row


@router.delete("/modulos/{modulo_id}", status_code=status.HTTP_200_OK)
def delete_modulo(
    modulo_id: UUID, _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS))
):
    """Tenta excluir definitivamente o modulo (so possivel se nunca foi
    habilitado em nenhuma licenca/perfil). Se houver referencias, inativa
    (soft delete) em vez de apagar o historico."""
    with get_conn() as conn, conn.cursor() as cur:
        try:
            cur.execute("delete from modulos where id = %s returning id;", (modulo_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Modulo nao encontrado")
            conn.commit()
            return {"deleted": True, "inativado": False}
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            cur.execute(
                "update modulos set ativo = false where id = %s returning id;",
                (modulo_id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Modulo nao encontrado")
            conn.commit()
            return {"deleted": False, "inativado": True}


# ============================================================
# Perfis de acesso
# ============================================================
@router.get("/perfis-acesso", response_model=list[PerfilAcesso])
def list_perfis_acesso(_: CurrentUser = Depends(require_menu(*_QUALQUER_MENU_LICENCIAMENTO))):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select p.*, coalesce(pm.modulo_ids, '{}') as modulo_ids, "
            "coalesce(pmenu.menu_ids, '{}') as menu_ids "
            "from perfis_acesso p "
            "left join lateral ("
            "  select array_agg(modulo_id) as modulo_ids from perfil_modulo_permissoes where perfil_id = p.id"
            ") pm on true "
            "left join lateral ("
            "  select array_agg(menu_codigo) as menu_ids from perfil_menu_permissoes where perfil_id = p.id"
            ") pmenu on true "
            "order by p.ativo desc, p.nome;"
        )
        return cur.fetchall()


@router.post(
    "/perfis-acesso", response_model=PerfilAcesso, status_code=status.HTTP_201_CREATED
)
def create_perfil_acesso(
    payload: PerfilAcessoCreate,
    _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PERFIS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        data = payload.model_dump(exclude={"modulo_ids", "menu_ids"})
        cur.execute(
            """
            insert into perfis_acesso (codigo, nome, descricao, escopo)
            values (%(codigo)s, %(nome)s, %(descricao)s, %(escopo)s)
            returning *;
            """,
            data,
        )
        perfil = cur.fetchone()

        for modulo_id in payload.modulo_ids:
            cur.execute(
                """
                insert into perfil_modulo_permissoes (perfil_id, modulo_id, pode_ler)
                values (%s, %s, true)
                on conflict do nothing;
                """,
                (perfil["id"], modulo_id),
            )

        for menu_codigo in payload.menu_ids:
            cur.execute(
                "insert into perfil_menu_permissoes (perfil_id, menu_codigo) values (%s, %s) "
                "on conflict do nothing;",
                (perfil["id"], menu_codigo),
            )

        conn.commit()
        perfil["modulo_ids"] = payload.modulo_ids
        perfil["menu_ids"] = payload.menu_ids
        return perfil


@router.patch("/perfis-acesso/{perfil_id}", response_model=PerfilAcesso)
def update_perfil_acesso(
    perfil_id: UUID,
    payload: PerfilAcessoUpdate,
    _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PERFIS)),
):
    fields = payload.model_dump(exclude_unset=True)
    modulo_ids = fields.pop("modulo_ids", None)
    menu_ids = fields.pop("menu_ids", None)
    if not fields and modulo_ids is None and menu_ids is None:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")

    with get_conn() as conn, conn.cursor() as cur:
        if modulo_ids is not None:
            cur.execute("delete from perfil_modulo_permissoes where perfil_id = %s;", (perfil_id,))
            for modulo_id in modulo_ids:
                cur.execute(
                    """
                    insert into perfil_modulo_permissoes (perfil_id, modulo_id, pode_ler)
                    values (%s, %s, true)
                    on conflict do nothing;
                    """,
                    (perfil_id, str(modulo_id)),
                )

        if menu_ids is not None:
            cur.execute("delete from perfil_menu_permissoes where perfil_id = %s;", (perfil_id,))
            for menu_codigo in menu_ids:
                cur.execute(
                    "insert into perfil_menu_permissoes (perfil_id, menu_codigo) values (%s, %s) "
                    "on conflict do nothing;",
                    (perfil_id, menu_codigo),
                )

        if fields:
            set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
            fields["id"] = str(perfil_id)
            cur.execute(f"update perfis_acesso set {set_clause} where id = %(id)s returning *;", fields)
            row = cur.fetchone()
        else:
            cur.execute("select * from perfis_acesso where id = %s;", (perfil_id,))
            row = cur.fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Perfil nao encontrado")

        cur.execute(
            "select coalesce(array_agg(modulo_id), '{}') as modulo_ids from perfil_modulo_permissoes where perfil_id = %s;",
            (perfil_id,),
        )
        row["modulo_ids"] = cur.fetchone()["modulo_ids"]
        cur.execute(
            "select coalesce(array_agg(menu_codigo), '{}') as menu_ids from perfil_menu_permissoes where perfil_id = %s;",
            (perfil_id,),
        )
        row["menu_ids"] = cur.fetchone()["menu_ids"]
        conn.commit()
        return row


@router.delete("/perfis-acesso/{perfil_id}", status_code=status.HTTP_200_OK)
def delete_perfil_acesso(
    perfil_id: UUID, _: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PERFIS))
):
    """Tenta excluir definitivamente o perfil (so possivel se nunca foi
    concedido a nenhum usuario). Se ja estiver em uso, inativa (soft
    delete) em vez de apagar o historico de acesso."""
    with get_conn() as conn, conn.cursor() as cur:
        try:
            cur.execute("delete from perfis_acesso where id = %s returning id;", (perfil_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Perfil nao encontrado")
            conn.commit()
            return {"deleted": True, "inativado": False}
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            cur.execute(
                "update perfis_acesso set ativo = false where id = %s returning id;",
                (perfil_id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Perfil nao encontrado")
            conn.commit()
            return {"deleted": False, "inativado": True}


# ============================================================
# Clientes (escritorios)
# ============================================================
@router.get("/clientes", response_model=list[Cliente])
def list_clientes(
    user: CurrentUser = Depends(
        require_menu(*_QUALQUER_MENU_LICENCIAMENTO, MENU_RELATORIO_ESCRITORIOS)
    ),
):
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        if papel == "master":
            cur.execute("select * from clientes order by nome;")
        elif papel == "administrador":
            cur.execute(
                "select * from clientes where id = any(%s::uuid[]) order by nome;",
                (list(escopo),),
            )
        else:
            proprio_cliente_id = get_usuario_cliente_id(conn, user.id)
            cur.execute(
                "select * from clientes where id = %s order by nome;",
                (proprio_cliente_id,),
            )
        return cur.fetchall()


@router.post("/clientes", response_model=Cliente, status_code=status.HTTP_201_CREATED)
def create_cliente(
    payload: ClienteCreate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS)),
):
    with get_conn() as conn:
        papel, _ = get_escopo(conn, user.id)
        require_papel_master(papel)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into clientes (nome, email_contato, ativo)
            values (%(nome)s, %(email_contato)s, %(ativo)s)
            returning *;
            """,
            payload.model_dump(),
        )
        row = cur.fetchone()
        conn.commit()
        return row


@router.patch("/clientes/{cliente_id}", response_model=Cliente)
def update_cliente(
    cliente_id: UUID,
    payload: ClienteUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS)),
):
    with get_conn() as conn:
        papel, _ = get_escopo(conn, user.id)
        require_papel_master(papel)
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(cliente_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"update clientes set {set_clause} where id = %(id)s returning *;", fields
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Escritorio nao encontrado")
        conn.commit()
        return row


@router.delete("/clientes/{cliente_id}", response_model=Cliente)
def delete_cliente(
    cliente_id: UUID, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS))
):
    """Inativa o escritorio (soft delete) em vez de excluir fisicamente: exclusao
    fisica faria cascade em cnpjs/licencas/usuarios e apagaria conciliacoes e
    lancamentos contabeis reais desses CNPJs."""
    with get_conn() as conn:
        papel, _ = get_escopo(conn, user.id)
        require_papel_master(papel)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "update clientes set ativo = false where id = %s returning *;", (cliente_id,)
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Escritorio nao encontrado")
        conn.commit()
        return row


# ============================================================
# CNPJs
# ============================================================
@router.get("/cnpjs", response_model=list[Cnpj])
def list_cnpjs_todos(
    cliente_id: UUID | None = None,
    user: CurrentUser = Depends(
        require_menu(*_QUALQUER_MENU_LICENCIAMENTO, MENU_RELATORIO_CLIENTES)
    ),
):
    """CNPJs agregados — sem exigir um cliente_id fixo, ao contrario de
    /clientes/{cliente_id}/cnpjs. Usado pelo relatorio 'Clientes' do Portal
    Contabil, que precisa dos CNPJs de todos os escritorios no escopo do
    usuario de uma vez."""
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        if cliente_id:
            require_escopo_cliente(str(cliente_id), papel, escopo)
            cur.execute(
                "select * from cnpjs where cliente_id = %s order by razao_social;",
                (cliente_id,),
            )
        elif papel == "administrador":
            cur.execute(
                "select * from cnpjs where cliente_id = any(%s::uuid[]) order by razao_social;",
                (list(escopo),),
            )
        elif papel == "master":
            cur.execute("select * from cnpjs order by razao_social;")
        else:
            # usuario comum: so os CNPJs cobertos por licencas vinculadas a
            # ele via usuario_licencas (por_cnpj direto, ou por_cliente
            # abrangendo todos os CNPJs ativos do escritorio).
            cur.execute(
                """
                select distinct c.*
                from cnpjs c
                join licencas l on (
                    (l.cnpj_id = c.id)
                    or (l.cnpj_id is null and l.cliente_id = c.cliente_id and c.ativo)
                )
                join usuario_licencas ul on ul.licenca_id = l.id
                where ul.usuario_id = %s
                order by c.razao_social;
                """,
                (user.id,),
            )
        return cur.fetchall()


@router.get("/clientes/{cliente_id}/cnpjs", response_model=list[Cnpj])
def list_cnpjs(
    cliente_id: UUID, user: CurrentUser = Depends(require_menu(*_QUALQUER_MENU_LICENCIAMENTO))
):
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(str(cliente_id), papel, escopo)
        cur.execute(
            "select * from cnpjs where cliente_id = %s order by razao_social;",
            (cliente_id,),
        )
        return cur.fetchall()


@router.post("/cnpjs", response_model=Cnpj, status_code=status.HTTP_201_CREATED)
def create_cnpj(
    payload: CnpjCreate, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS))
):
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(str(payload.cliente_id), papel, escopo)
        cur.execute(
            """
            insert into cnpjs (cliente_id, cnpj, razao_social, nome_fantasia, email_contato, telefone, ativo)
            values (%(cliente_id)s, %(cnpj)s, %(razao_social)s, %(nome_fantasia)s, %(email_contato)s, %(telefone)s, %(ativo)s)
            returning *;
            """,
            payload.model_dump(),
        )
        row = cur.fetchone()
        conn.commit()
        return row


def _cnpj_cliente_id(cur, cnpj_id: UUID) -> str:
    cur.execute("select cliente_id from cnpjs where id = %s;", (cnpj_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Cliente (CNPJ) nao encontrado")
    return str(row["cliente_id"])


@router.patch("/cnpjs/{cnpj_id}", response_model=Cnpj)
def update_cnpj(
    cnpj_id: UUID,
    payload: CnpjUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS)),
):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(cnpj_id)
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(_cnpj_cliente_id(cur, cnpj_id), papel, escopo)
        cur.execute(f"update cnpjs set {set_clause} where id = %(id)s returning *;", fields)
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Cliente (CNPJ) nao encontrado")
        conn.commit()
        return row


@router.delete("/cnpjs/{cnpj_id}", response_model=Cnpj)
def delete_cnpj(
    cnpj_id: UUID, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_ESCRITORIOS))
):
    """Inativa o cliente/CNPJ (soft delete): exclusao fisica faria cascade em
    conciliacoes e lancamentos contabeis reais desse CNPJ."""
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(_cnpj_cliente_id(cur, cnpj_id), papel, escopo)
        cur.execute(
            "update cnpjs set ativo = false where id = %s returning *;", (cnpj_id,)
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Cliente (CNPJ) nao encontrado")
        conn.commit()
        return row


# ============================================================
# Licencas
# ============================================================
@router.get("/licencas", response_model=list[Licenca])
def list_licencas(
    cliente_id: UUID | None = None,
    produto_id: UUID | None = None,
    user: CurrentUser = Depends(
        require_menu(*_QUALQUER_MENU_LICENCIAMENTO, MENU_RELATORIO_PRODUTOS)
    ),
):
    filters = []
    params: dict = {}
    if cliente_id:
        filters.append("l.cliente_id = %(cliente_id)s")
        params["cliente_id"] = str(cliente_id)
    if produto_id:
        filters.append("l.produto_id = %(produto_id)s")
        params["produto_id"] = str(produto_id)

    with get_conn() as conn:
        papel, escopo = get_escopo(conn, user.id)
        if cliente_id:
            require_escopo_cliente(str(cliente_id), papel, escopo)
        elif papel == "administrador":
            filters.append("l.cliente_id = any(%(escopo)s::uuid[])")
            params["escopo"] = list(escopo)
        elif papel == "usuario":
            filters.append(
                "l.id in (select licenca_id from usuario_licencas where usuario_id = %(usuario_id)s)"
            )
            params["usuario_id"] = user.id
        where_clause = f"where {' and '.join(filters)}" if filters else ""

        renovar_licencas_vencidas(conn)
        with conn.cursor() as cur:
            cur.execute(
                "select l.*, coalesce(lm.modulo_ids, '{}') as modulo_ids, "
                "exists ("
                "  select 1 from conciliacoes co join cnpjs cn on cn.id = co.cnpj_id "
                "  where (l.cnpj_id is not null and co.cnpj_id = l.cnpj_id) "
                "     or (l.cnpj_id is null and cn.cliente_id = l.cliente_id)"
                ") as tem_movimentacao "
                "from licencas l "
                "left join lateral ("
                "  select array_agg(modulo_id) as modulo_ids from licenca_modulos where licenca_id = l.id"
                f") lm on true {where_clause} "
                "order by l.criado_em desc;",
                params,
            )
            return cur.fetchall()


@router.post("/licencas", response_model=Licenca, status_code=status.HTTP_201_CREATED)
def create_licenca(
    payload: LicencaCreate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)),
):
    with get_conn() as conn:
        papel, _ = get_escopo(conn, user.id)
        require_papel_master(papel)
    if not payload.modulo_ids:
        raise HTTPException(
            status_code=422, detail="Selecione ao menos um modulo para ativar a licenca"
        )
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select escopo_licenca from produtos where id = %s;", (payload.produto_id,))
        produto = cur.fetchone()
        if produto is None:
            raise HTTPException(status_code=404, detail="Produto nao encontrado")
        if produto["escopo_licenca"] == "por_cnpj" and payload.cnpj_id is None:
            raise HTTPException(
                status_code=422,
                detail="Este produto exige licenciamento por CNPJ (cnpj_id obrigatorio)",
            )
        if produto["escopo_licenca"] == "por_cliente" and payload.cnpj_id is not None:
            raise HTTPException(
                status_code=422,
                detail="Este produto e licenciado por cliente (cnpj_id deve ser nulo)",
            )

        if produto["escopo_licenca"] == "por_cliente":
            cur.execute(
                "select 1 from licencas where produto_id = %s and cliente_id = %s and status <> 'cancelada';",
                (payload.produto_id, payload.cliente_id),
            )
        else:
            cur.execute(
                "select 1 from licencas where produto_id = %s and cnpj_id = %s and status <> 'cancelada';",
                (payload.produto_id, payload.cnpj_id),
            )
        if cur.fetchone() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ja existe uma licenca (ativa ou suspensa) deste produto para este escritorio/CNPJ",
            )

        cur.execute(
            "select coalesce(sum(valor_execucao), 0) as total from modulos where id = any(%s::uuid[]);",
            ([str(m) for m in payload.modulo_ids],),
        )
        valor = float(cur.fetchone()["total"])

        data = payload.model_dump(exclude={"modulo_ids"})
        data["valor_unitario"] = valor
        data["valor_total"] = valor * data["qtd_licencas"]
        if data["data_fim"] is None:
            data["data_fim"] = _um_ano_apos(data["data_inicio"])
        cur.execute(
            """
            insert into licencas
                (cliente_id, produto_id, cnpj_id, qtd_licencas, valor_unitario,
                 valor_total, periodicidade, data_inicio, data_fim, status, observacoes)
            values
                (%(cliente_id)s, %(produto_id)s, %(cnpj_id)s, %(qtd_licencas)s, %(valor_unitario)s,
                 %(valor_total)s, %(periodicidade)s, %(data_inicio)s, %(data_fim)s, %(status)s, %(observacoes)s)
            returning *;
            """,
            data,
        )
        licenca = cur.fetchone()

        for modulo_id in payload.modulo_ids:
            cur.execute(
                "insert into licenca_modulos (licenca_id, modulo_id) values (%s, %s) "
                "on conflict do nothing;",
                (licenca["id"], modulo_id),
            )

        conn.commit()
        licenca["modulo_ids"] = payload.modulo_ids
        return licenca


@router.patch("/licencas/{licenca_id}", response_model=Licenca)
def update_licenca(
    licenca_id: UUID,
    payload: LicencaUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)),
):
    with get_conn() as conn:
        papel, _ = get_escopo(conn, user.id)
        require_papel_master(papel)
    fields = payload.model_dump(exclude_unset=True)
    modulo_ids = fields.pop("modulo_ids", None)
    if not fields and modulo_ids is None:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")

    with get_conn() as conn, conn.cursor() as cur:
        if fields.get("status") == "cancelada":
            cur.execute(
                "select *, (select coalesce(array_agg(modulo_id), '{}') from licenca_modulos "
                "where licenca_id = licencas.id) as modulo_ids from licencas where id = %s;",
                (licenca_id,),
            )
            licenca = cur.fetchone()
            if licenca is None:
                raise HTTPException(status_code=404, detail="Licenca nao encontrada")

            if licenca["cnpj_id"] is not None:
                cnpj_ids = [licenca["cnpj_id"]]
            else:
                cur.execute("select id from cnpjs where cliente_id = %s;", (licenca["cliente_id"],))
                cnpj_ids = [r["id"] for r in cur.fetchall()]

            tem_movimentacao = False
            if cnpj_ids:
                cur.execute(
                    "select 1 from conciliacoes where cnpj_id = any(%s::uuid[]) limit 1;",
                    (cnpj_ids,),
                )
                tem_movimentacao = cur.fetchone() is not None

            if not tem_movimentacao:
                # Sem lancamentos/conciliacoes vinculados: cancelar remove a
                # ativacao por completo (em vez de so marcar cancelada), para
                # que o produto volte a aparecer como "Nao ativado" e possa
                # ser reativado do zero, sem modulos pre-selecionados.
                cur.execute("delete from licencas where id = %s;", (licenca_id,))
                conn.commit()
                licenca["status"] = "cancelada"
                return licenca

        if modulo_ids is not None:
            cur.execute("select qtd_licencas from licencas where id = %s;", (licenca_id,))
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Licenca nao encontrada")

            cur.execute("delete from licenca_modulos where licenca_id = %s;", (licenca_id,))
            for modulo_id in modulo_ids:
                cur.execute(
                    "insert into licenca_modulos (licenca_id, modulo_id) values (%s, %s) "
                    "on conflict do nothing;",
                    (licenca_id, str(modulo_id)),
                )
            cur.execute(
                "select coalesce(sum(valor_execucao), 0) as total from modulos where id = any(%s::uuid[]);",
                ([str(m) for m in modulo_ids],),
            )
            valor = float(cur.fetchone()["total"])
            qtd = fields.get("qtd_licencas", existing["qtd_licencas"])
            fields["valor_unitario"] = valor
            fields["valor_total"] = valor * qtd

        set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
        fields["id"] = str(licenca_id)
        cur.execute(
            f"update licencas set {set_clause} where id = %(id)s "
            "returning *, (select coalesce(array_agg(modulo_id), '{}') from licenca_modulos where licenca_id = %(id)s) as modulo_ids;",
            fields,
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Licenca nao encontrada")
        conn.commit()
        return row


# ============================================================
# Usuarios do portal
# ============================================================
def _with_auth_meta(rows: list[dict]) -> list[dict]:
    if not rows:
        return rows
    meta_by_id = supabase_admin.get_users_meta([str(r["id"]) for r in rows])
    for row in rows:
        meta = meta_by_id.get(str(row["id"]), {"convite_status": "pendente", "email": None})
        row["convite_status"] = meta["convite_status"]
        row["email"] = meta["email"]
    return rows


def _with_escritorios_administrados(cur, rows: list[dict]) -> list[dict]:
    """Preenche escritorios_administrados para as linhas com papel
    'administrador'; demais ficam com lista vazia (default do schema)."""
    ids = [str(r["id"]) for r in rows if r.get("papel") == "administrador"]
    if not ids:
        return rows
    cur.execute(
        "select usuario_id, cliente_id from administrador_clientes where usuario_id = any(%s::uuid[]);",
        (ids,),
    )
    por_usuario: dict[str, list] = {}
    for r in cur.fetchall():
        por_usuario.setdefault(str(r["usuario_id"]), []).append(r["cliente_id"])
    for row in rows:
        row["escritorios_administrados"] = por_usuario.get(str(row["id"]), [])
    return rows


def _validar_papel_alvo(papel_alvo: str, papel_ator: str | None) -> None:
    """So master atribui papel master; administrador ou master atribuem
    administrador; qualquer ator com acesso ao menu atribui usuario."""
    if papel_alvo == "master" and papel_ator != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente o Master pode atribuir o papel Master",
        )
    if papel_alvo == "administrador" and papel_ator not in ("master", "administrador"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao tem permissao para atribuir o papel Administrador",
        )


@router.post(
    "/usuarios/convite", response_model=UsuarioPortal, status_code=status.HTTP_201_CREATED
)
def convidar_usuario(
    payload: UsuarioConviteCreate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    with get_conn() as conn:
        papel_ator, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(str(payload.cliente_id), papel_ator, escopo)
        _validar_papel_alvo(payload.papel, papel_ator)

    try:
        auth_user_id = supabase_admin.create_user_with_password(
            payload.email, payload.nome, payload.senha
        )
    except supabase_admin.SupabaseAdminError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into usuarios_portal (id, cliente_id, nome, ativo, perfil_acesso_id, papel)
            values (%(id)s, %(cliente_id)s, %(nome)s, true, %(perfil_acesso_id)s, %(papel)s)
            on conflict (id) do nothing
            returning *;
            """,
            {
                "id": auth_user_id,
                "cliente_id": str(payload.cliente_id),
                "nome": payload.nome,
                "perfil_acesso_id": str(payload.perfil_acesso_id),
                "papel": payload.papel,
            },
        )
        usuario = cur.fetchone()
        if usuario is None:
            cur.execute("select * from usuarios_portal where id = %s;", (auth_user_id,))
            usuario = cur.fetchone()

        # usuario_licencas continua sendo concedida para as licencas ativas do
        # escritorio (controla acesso por MODULO dentro delas) — mas o acesso a
        # MENUS ja esta garantido acima via usuarios_portal.perfil_acesso_id,
        # independente de existir alguma licenca ativa ou nao.
        cur.execute(
            "select id from licencas where cliente_id = %s and status = 'ativa';",
            (str(payload.cliente_id),),
        )
        for licenca in cur.fetchall():
            cur.execute(
                """
                insert into usuario_licencas (usuario_id, licenca_id, perfil_acesso_id)
                values (%s, %s, %s)
                on conflict do nothing;
                """,
                (auth_user_id, licenca["id"], str(payload.perfil_acesso_id)),
            )

        conn.commit()
        meta = supabase_admin.get_users_meta([auth_user_id])[auth_user_id]
        usuario["convite_status"] = meta["convite_status"]
        usuario["email"] = meta["email"]
        return usuario


@router.get("/usuarios", response_model=list[UsuarioPortal])
def list_todos_usuarios(user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS))):
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        if papel == "administrador":
            cur.execute(
                "select * from usuarios_portal where cliente_id = any(%s::uuid[]) order by nome;",
                (list(escopo),),
            )
        else:
            cur.execute("select * from usuarios_portal order by nome;")
        rows = _with_escritorios_administrados(cur, cur.fetchall())
        return _with_auth_meta(rows)


@router.get("/usuarios/{cliente_id}", response_model=list[UsuarioPortal])
def list_usuarios(
    cliente_id: UUID, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS))
):
    with get_conn() as conn, conn.cursor() as cur:
        papel, escopo = get_escopo(conn, user.id)
        require_escopo_cliente(str(cliente_id), papel, escopo)
        cur.execute(
            "select * from usuarios_portal where cliente_id = %s order by nome;",
            (cliente_id,),
        )
        rows = _with_escritorios_administrados(cur, cur.fetchall())
        return _with_auth_meta(rows)


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioPortal)
def update_usuario(
    usuario_id: UUID,
    payload: UsuarioPortalUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    fields = payload.model_dump(exclude_unset=True)
    senha = fields.pop("senha", None)
    email = fields.pop("email", None)
    perfil_acesso_id = fields.get("perfil_acesso_id")
    papel_alvo = fields.get("papel")
    if not fields and senha is None and email is None:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")

    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo_row = cur.fetchone()
        if alvo_row is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo_row["cliente_id"]), papel_ator, escopo)
        if papel_alvo is not None:
            _validar_papel_alvo(papel_alvo, papel_ator)

        if fields:
            set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
            fields["id"] = str(usuario_id)
            cur.execute(
                f"update usuarios_portal set {set_clause} where id = %(id)s returning *;", fields
            )
        else:
            cur.execute("select * from usuarios_portal where id = %s;", (str(usuario_id),))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        conn.commit()

        if senha is not None:
            try:
                supabase_admin.set_user_password(str(usuario_id), senha)
            except supabase_admin.SupabaseAdminError as exc:
                raise HTTPException(status_code=502, detail=exc.message) from exc

        if email is not None:
            try:
                supabase_admin.update_user_email(str(usuario_id), email)
            except supabase_admin.SupabaseAdminError as exc:
                raise HTTPException(status_code=502, detail=exc.message) from exc

        if perfil_acesso_id is not None:
            # usuarios_portal.perfil_acesso_id (acima) ja e a fonte de verdade
            # para MENUS. Isso aqui e so para manter consistente o controle
            # fino por MODULO dentro de licencas ja concedidas (usuario_licencas),
            # que nao deve ficar com um perfil desatualizado depois da troca.
            cur.execute(
                "update usuario_licencas set perfil_acesso_id = %s where usuario_id = %s;",
                (str(perfil_acesso_id), str(usuario_id)),
            )
            cur.execute(
                """
                insert into usuario_licencas (usuario_id, licenca_id, perfil_acesso_id)
                select %(usuario_id)s, l.id, %(perfil_acesso_id)s
                from licencas l
                where l.cliente_id = %(cliente_id)s
                  and l.status = 'ativa'
                  and not exists (
                    select 1 from usuario_licencas ul
                    where ul.usuario_id = %(usuario_id)s and ul.licenca_id = l.id
                  )
                on conflict do nothing;
                """,
                {
                    "usuario_id": str(usuario_id),
                    "cliente_id": str(row["cliente_id"]),
                    "perfil_acesso_id": str(perfil_acesso_id),
                },
            )
            conn.commit()

        meta = supabase_admin.get_users_meta([str(usuario_id)])[str(usuario_id)]
        row["convite_status"] = meta["convite_status"]
        row["email"] = meta["email"]
        return _with_escritorios_administrados(cur, [row])[0]


@router.put("/usuarios/{usuario_id}/escritorios-administrados", response_model=UsuarioPortal)
def set_escritorios_administrados(
    usuario_id: UUID,
    payload: EscritoriosAdministradosUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    """Substitui o conjunto de escritorios que o usuario-alvo administra.
    Quem atribui so pode conceder escritorios que ja estao no seu proprio
    escopo (master tem escopo total, entao pode atribuir qualquer um)."""
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select papel, cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        if alvo["papel"] != "administrador":
            raise HTTPException(
                status_code=422,
                detail="Usuario precisa ter o papel Administrador para receber escritorios",
            )
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)

        cliente_ids = {str(c) for c in payload.cliente_ids}
        if papel_ator != "master" and not cliente_ids.issubset(escopo_ator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voce so pode atribuir escritorios que voce mesmo administra",
            )

        cur.execute("delete from administrador_clientes where usuario_id = %s;", (usuario_id,))
        for cliente_id in cliente_ids:
            cur.execute(
                "insert into administrador_clientes (usuario_id, cliente_id) values (%s, %s) "
                "on conflict do nothing;",
                (str(usuario_id), cliente_id),
            )
        conn.commit()

        cur.execute("select * from usuarios_portal where id = %s;", (usuario_id,))
        row = cur.fetchone()
        row = _with_escritorios_administrados(cur, [row])[0]
        meta = supabase_admin.get_users_meta([str(usuario_id)])[str(usuario_id)]
        row["convite_status"] = meta["convite_status"]
        row["email"] = meta["email"]
        return row


@router.put("/usuarios/{usuario_id}/modulos")
def set_modulos_usuario(
    usuario_id: UUID,
    payload: ModulosUsuarioUpdate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    """Concede, para uma licenca especifica, exatamente o conjunto de
    modulos passado (allowlist por usuario — substitui o conjunto anterior)."""
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)

        cur.execute("select cliente_id from licencas where id = %s;", (payload.licenca_id,))
        licenca = cur.fetchone()
        if licenca is None:
            raise HTTPException(status_code=404, detail="Licenca nao encontrada")
        require_escopo_cliente(str(licenca["cliente_id"]), papel_ator, escopo_ator)

        cur.execute(
            "delete from usuario_modulos where usuario_id = %s and licenca_id = %s;",
            (str(usuario_id), str(payload.licenca_id)),
        )
        for modulo_id in payload.modulo_ids:
            cur.execute(
                "insert into usuario_modulos (usuario_id, licenca_id, modulo_id) "
                "values (%s, %s, %s) on conflict do nothing;",
                (str(usuario_id), str(payload.licenca_id), str(modulo_id)),
            )
        conn.commit()
        return {"licenca_id": str(payload.licenca_id), "modulo_ids": [str(m) for m in payload.modulo_ids]}


@router.get("/usuarios/{usuario_id}/modulos", response_model=list[UUID])
def get_modulos_usuario(
    usuario_id: UUID,
    licenca_id: UUID,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)

        cur.execute(
            "select modulo_id from usuario_modulos where usuario_id = %s and licenca_id = %s;",
            (str(usuario_id), str(licenca_id)),
        )
        return [r["modulo_id"] for r in cur.fetchall()]


@router.post("/usuarios/{usuario_id}/solicitar-senha", status_code=status.HTTP_200_OK)
def solicitar_senha_usuario(
    usuario_id: UUID, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS))
):
    """Envia o e-mail de redefinicao de senha do Supabase para o usuario —
    o admin nunca ve/define a senha diretamente, apenas aciona o envio."""
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)
    try:
        supabase_admin.send_password_reset(str(usuario_id))
    except supabase_admin.SupabaseAdminError as e:
        raise HTTPException(status_code=502, detail=e.message) from e
    return {"enviado": True}


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_200_OK)
def delete_usuario(
    usuario_id: UUID, user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS))
):
    """Revoga o acesso do usuario ao portal (inativa) sem apagar a conta de
    autenticacao nem o historico de vinculos com licencas — reversivel
    reativando (PATCH ativo=true)."""
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)

        cur.execute(
            "update usuarios_portal set ativo = false where id = %s returning id;",
            (usuario_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        conn.commit()
        return {"deleted": False, "inativado": True}


@router.post(
    "/usuario-licencas",
    response_model=UsuarioLicenca,
    status_code=status.HTTP_201_CREATED,
)
def create_usuario_licenca(
    payload: UsuarioLicencaCreate,
    user: CurrentUser = Depends(require_menu(MENU_LICENCIAMENTO_USUARIOS)),
):
    with get_conn() as conn, conn.cursor() as cur:
        papel_ator, escopo_ator = get_escopo(conn, user.id)
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (payload.usuario_id,))
        alvo = cur.fetchone()
        if alvo is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        require_escopo_cliente(str(alvo["cliente_id"]), papel_ator, escopo_ator)
        cur.execute(
            """
            insert into usuario_licencas (usuario_id, licenca_id, perfil_acesso_id)
            values (%(usuario_id)s, %(licenca_id)s, %(perfil_acesso_id)s)
            returning *;
            """,
            payload.model_dump(),
        )
        row = cur.fetchone()
        conn.commit()
        return row


@router.get("/me/licencas", response_model=list[Licenca])
def list_minhas_licencas(user: CurrentUser = Depends(get_current_user)):
    """Licencas do usuario autenticado (usado pelo Portal Contabil para saber a quais
    produtos/CNPJs ele tem acesso)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select l.*, coalesce(lm.modulo_ids, '{}') as modulo_ids
            from usuario_licencas ul
            join licencas l on l.id = ul.licenca_id
            left join lateral (
                select array_agg(modulo_id) as modulo_ids
                from licenca_modulos where licenca_id = l.id
            ) lm on true
            where ul.usuario_id = %s and l.status = 'ativa'
            order by l.criado_em desc;
            """,
            (user.id,),
        )
        return cur.fetchall()
