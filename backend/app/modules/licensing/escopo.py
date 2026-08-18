"""Escopo de dados por papel (master | administrador | usuario).

papel decide QUAIS escritorios/CNPJs/licencas a pessoa alcanca; e ortogonal
a perfil_acesso (que decide quais TELAS aparecem, via menus.py).

master: bypass total, alcanca todos os clientes.
administrador: alcanca somente os clientes listados em administrador_clientes
para ele.
usuario: nao administra nenhum cliente (escopo vazio) — acesso dele ao
Portal Contabil continua via usuario_licencas/usuario_modulos, nao por aqui.
"""

from fastapi import HTTPException, status


def get_escopo(conn, usuario_id: str) -> tuple[str, set[str]]:
    """Retorna (papel, cliente_ids_administrados). Para master, o segundo
    valor e um conjunto vazio (ele nao precisa de linhas em
    administrador_clientes — o bypass e feito por papel, nao por escopo)."""
    with conn.cursor() as cur:
        cur.execute("select papel from usuarios_portal where id = %s;", (usuario_id,))
        row = cur.fetchone()
        papel = row["papel"] if row else None

        clientes: set[str] = set()
        if papel == "administrador":
            cur.execute(
                "select cliente_id from administrador_clientes where usuario_id = %s;",
                (usuario_id,),
            )
            clientes = {str(r["cliente_id"]) for r in cur.fetchall()}

        return papel, clientes


def require_escopo_cliente(cliente_id: str, papel: str | None, escopo: set[str]) -> None:
    """Levanta 403 a menos que papel seja master, ou administrador com
    cliente_id dentro do proprio escopo."""
    if papel == "master":
        return
    if papel == "administrador" and str(cliente_id) in escopo:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Voce nao administra este escritorio",
    )


def get_usuario_cliente_id(conn, usuario_id: str) -> str | None:
    """Escritorio (cliente_id) ao qual o proprio usuario pertence — usado
    para escopar relatorios do papel 'usuario' (que nao administra nenhum
    cliente, mas pertence a exatamente um)."""
    with conn.cursor() as cur:
        cur.execute("select cliente_id from usuarios_portal where id = %s;", (usuario_id,))
        row = cur.fetchone()
        return str(row["cliente_id"]) if row else None


def require_papel_master(papel: str | None) -> None:
    if papel != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acao restrita ao Master",
        )
