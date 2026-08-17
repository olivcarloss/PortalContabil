from datetime import date
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status

from app.core import supabase_admin
from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_user
from app.modules.licensing.renovacao import renovar_licencas_vencidas
from app.schemas.licensing import (
    Cliente,
    ClienteCreate,
    ClienteUpdate,
    Cnpj,
    CnpjCreate,
    CnpjUpdate,
    Licenca,
    LicencaCreate,
    LicencaUpdate,
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
def list_produtos(_: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select * from produtos order by ativo desc, nome;")
        return cur.fetchall()


@router.post("/produtos", response_model=Produto, status_code=status.HTTP_201_CREATED)
def create_produto(payload: ProdutoCreate, _: CurrentUser = Depends(get_current_user)):
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
    produto_id: UUID, payload: ProdutoUpdate, _: CurrentUser = Depends(get_current_user)
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
def delete_produto(produto_id: UUID, _: CurrentUser = Depends(get_current_user)):
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
def list_modulos(produto_id: UUID, _: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select * from modulos where produto_id = %s order by nome;", (produto_id,)
        )
        return cur.fetchall()


@router.post(
    "/produtos/{produto_id}/modulos", response_model=Modulo, status_code=status.HTTP_201_CREATED
)
def create_modulo(
    produto_id: UUID, payload: ModuloCreate, _: CurrentUser = Depends(get_current_user)
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
    modulo_id: UUID, payload: ModuloUpdate, _: CurrentUser = Depends(get_current_user)
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
def delete_modulo(modulo_id: UUID, _: CurrentUser = Depends(get_current_user)):
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
def list_perfis_acesso(_: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select p.*, coalesce(pm.modulo_ids, '{}') as modulo_ids "
            "from perfis_acesso p "
            "left join lateral ("
            "  select array_agg(modulo_id) as modulo_ids from perfil_modulo_permissoes where perfil_id = p.id"
            ") pm on true "
            "order by p.ativo desc, p.nome;"
        )
        return cur.fetchall()


@router.post(
    "/perfis-acesso", response_model=PerfilAcesso, status_code=status.HTTP_201_CREATED
)
def create_perfil_acesso(
    payload: PerfilAcessoCreate, _: CurrentUser = Depends(get_current_user)
):
    with get_conn() as conn, conn.cursor() as cur:
        data = payload.model_dump(exclude={"modulo_ids"})
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

        conn.commit()
        perfil["modulo_ids"] = payload.modulo_ids
        return perfil


@router.patch("/perfis-acesso/{perfil_id}", response_model=PerfilAcesso)
def update_perfil_acesso(
    perfil_id: UUID, payload: PerfilAcessoUpdate, _: CurrentUser = Depends(get_current_user)
):
    fields = payload.model_dump(exclude_unset=True)
    modulo_ids = fields.pop("modulo_ids", None)
    if not fields and modulo_ids is None:
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
        conn.commit()
        return row


@router.delete("/perfis-acesso/{perfil_id}", status_code=status.HTTP_200_OK)
def delete_perfil_acesso(perfil_id: UUID, _: CurrentUser = Depends(get_current_user)):
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
def list_clientes(_: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select * from clientes order by nome;")
        return cur.fetchall()


@router.post("/clientes", response_model=Cliente, status_code=status.HTTP_201_CREATED)
def create_cliente(payload: ClienteCreate, _: CurrentUser = Depends(get_current_user)):
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
    cliente_id: UUID, payload: ClienteUpdate, _: CurrentUser = Depends(get_current_user)
):
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
def delete_cliente(cliente_id: UUID, _: CurrentUser = Depends(get_current_user)):
    """Inativa o escritorio (soft delete) em vez de excluir fisicamente: exclusao
    fisica faria cascade em cnpjs/licencas/usuarios e apagaria conciliacoes e
    lancamentos contabeis reais desses CNPJs."""
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
@router.get("/clientes/{cliente_id}/cnpjs", response_model=list[Cnpj])
def list_cnpjs(cliente_id: UUID, _: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select * from cnpjs where cliente_id = %s order by razao_social;",
            (cliente_id,),
        )
        return cur.fetchall()


@router.post("/cnpjs", response_model=Cnpj, status_code=status.HTTP_201_CREATED)
def create_cnpj(payload: CnpjCreate, _: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
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


@router.patch("/cnpjs/{cnpj_id}", response_model=Cnpj)
def update_cnpj(cnpj_id: UUID, payload: CnpjUpdate, _: CurrentUser = Depends(get_current_user)):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(cnpj_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"update cnpjs set {set_clause} where id = %(id)s returning *;", fields)
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Cliente (CNPJ) nao encontrado")
        conn.commit()
        return row


@router.delete("/cnpjs/{cnpj_id}", response_model=Cnpj)
def delete_cnpj(cnpj_id: UUID, _: CurrentUser = Depends(get_current_user)):
    """Inativa o cliente/CNPJ (soft delete): exclusao fisica faria cascade em
    conciliacoes e lancamentos contabeis reais desse CNPJ."""
    with get_conn() as conn, conn.cursor() as cur:
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
    _: CurrentUser = Depends(get_current_user),
):
    filters = []
    params: dict = {}
    if cliente_id:
        filters.append("l.cliente_id = %(cliente_id)s")
        params["cliente_id"] = str(cliente_id)
    if produto_id:
        filters.append("l.produto_id = %(produto_id)s")
        params["produto_id"] = str(produto_id)
    where_clause = f"where {' and '.join(filters)}" if filters else ""

    with get_conn() as conn:
        renovar_licencas_vencidas(conn)
        with conn.cursor() as cur:
            cur.execute(
                "select l.*, coalesce(lm.modulo_ids, '{}') as modulo_ids "
                "from licencas l "
                "left join lateral ("
                "  select array_agg(modulo_id) as modulo_ids from licenca_modulos where licenca_id = l.id"
                f") lm on true {where_clause} "
                "order by l.criado_em desc;",
                params,
            )
            return cur.fetchall()


@router.post("/licencas", response_model=Licenca, status_code=status.HTTP_201_CREATED)
def create_licenca(payload: LicencaCreate, _: CurrentUser = Depends(get_current_user)):
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
    licenca_id: UUID, payload: LicencaUpdate, _: CurrentUser = Depends(get_current_user)
):
    fields = payload.model_dump(exclude_unset=True)
    modulo_ids = fields.pop("modulo_ids", None)
    if not fields and modulo_ids is None:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")

    with get_conn() as conn, conn.cursor() as cur:
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
def _with_convite_status(rows: list[dict]) -> list[dict]:
    if not rows:
        return rows
    status_by_id = supabase_admin.get_users_status([str(r["id"]) for r in rows])
    for row in rows:
        row["convite_status"] = status_by_id.get(str(row["id"]), "pendente")
    return rows


@router.post(
    "/usuarios/convite", response_model=UsuarioPortal, status_code=status.HTTP_201_CREATED
)
def convidar_usuario(payload: UsuarioConviteCreate, _: CurrentUser = Depends(get_current_user)):
    try:
        auth_user_id, _is_new = supabase_admin.invite_user(payload.email, payload.nome)
    except supabase_admin.SupabaseAdminError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into usuarios_portal (id, cliente_id, nome, ativo)
            values (%(id)s, %(cliente_id)s, %(nome)s, true)
            on conflict (id) do nothing
            returning *;
            """,
            {"id": auth_user_id, "cliente_id": str(payload.cliente_id), "nome": payload.nome},
        )
        usuario = cur.fetchone()
        if usuario is None:
            cur.execute("select * from usuarios_portal where id = %s;", (auth_user_id,))
            usuario = cur.fetchone()

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
        usuario["convite_status"] = supabase_admin.get_users_status([auth_user_id])[auth_user_id]
        return usuario


@router.get("/usuarios", response_model=list[UsuarioPortal])
def list_todos_usuarios(_: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select * from usuarios_portal order by nome;")
        return _with_convite_status(cur.fetchall())


@router.get("/usuarios/{cliente_id}", response_model=list[UsuarioPortal])
def list_usuarios(cliente_id: UUID, _: CurrentUser = Depends(get_current_user)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select * from usuarios_portal where cliente_id = %s order by nome;",
            (cliente_id,),
        )
        return _with_convite_status(cur.fetchall())


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioPortal)
def update_usuario(
    usuario_id: UUID, payload: UsuarioPortalUpdate, _: CurrentUser = Depends(get_current_user)
):
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualizar")
    set_clause = ", ".join(f"{k} = %({k})s" for k in fields)
    fields["id"] = str(usuario_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"update usuarios_portal set {set_clause} where id = %(id)s returning *;", fields
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        conn.commit()
        row["convite_status"] = supabase_admin.get_users_status([str(usuario_id)])[str(usuario_id)]
        return row


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_200_OK)
def delete_usuario(usuario_id: UUID, _: CurrentUser = Depends(get_current_user)):
    """Revoga o acesso do usuario ao portal (inativa) sem apagar a conta de
    autenticacao nem o historico de vinculos com licencas — reversivel
    reativando (PATCH ativo=true)."""
    with get_conn() as conn, conn.cursor() as cur:
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
    payload: UsuarioLicencaCreate, _: CurrentUser = Depends(get_current_user)
):
    with get_conn() as conn, conn.cursor() as cur:
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
