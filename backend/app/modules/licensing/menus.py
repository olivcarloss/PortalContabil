"""Catalogo fixo de menus/submenus do portal, usados como unidade de
permissionamento por perfil de acesso (perfil_menu_permissoes).

Um usuario enxerga/acessa um menu se: (a) usuarios_portal.is_admin = true
(bypass total, superusuario da plataforma), OU (b) algum perfil_acesso
concedido a ele via uma licenca ativa (usuario_licencas -> licencas ->
perfis_acesso) inclui esse menu_codigo em perfil_menu_permissoes.
"""

from fastapi import Depends, HTTPException, status

from app.core.db import get_conn
from app.core.security import CurrentUser, get_current_user

MENU_ADMIN_VISAO_GERAL = "admin_visao_geral"
MENU_ADMIN_CONCILIACAO = "admin_conciliacao"
MENU_LICENCIAMENTO_VISAO_GERAL = "licenciamento_visao_geral"
MENU_LICENCIAMENTO_PRODUTOS = "licenciamento_produtos"
MENU_LICENCIAMENTO_ESCRITORIOS = "licenciamento_escritorios"
MENU_LICENCIAMENTO_USUARIOS = "licenciamento_usuarios"
MENU_LICENCIAMENTO_PERFIS = "licenciamento_perfis"
MENU_PORTAL_CONTABIL = "portal_contabil"

MENU_LABELS: dict[str, str] = {
    MENU_ADMIN_VISAO_GERAL: "One Page de Produtos",
    MENU_ADMIN_CONCILIACAO: "Conciliação (admin)",
    MENU_LICENCIAMENTO_VISAO_GERAL: "Licenciamento — Visão geral",
    MENU_LICENCIAMENTO_PRODUTOS: "Licenciamento — Produtos",
    MENU_LICENCIAMENTO_ESCRITORIOS: "Licenciamento — Escritórios",
    MENU_LICENCIAMENTO_USUARIOS: "Licenciamento — Usuários",
    MENU_LICENCIAMENTO_PERFIS: "Licenciamento — Perfis de acesso",
    MENU_PORTAL_CONTABIL: "Portal Contábil",
}

ALL_MENU_CODES: list[str] = list(MENU_LABELS)


def get_menus_liberados(conn, usuario_id: str) -> set[str]:
    """Menus que o usuario pode acessar. is_admin sempre libera tudo."""
    with conn.cursor() as cur:
        cur.execute("select is_admin from usuarios_portal where id = %s;", (usuario_id,))
        row = cur.fetchone()
        if row and row["is_admin"]:
            return set(ALL_MENU_CODES)

        cur.execute(
            """
            select distinct pmp.menu_codigo
            from usuario_licencas ul
            join licencas l on l.id = ul.licenca_id
            join perfis_acesso pa on pa.id = ul.perfil_acesso_id
            join perfil_menu_permissoes pmp on pmp.perfil_id = pa.id
            where ul.usuario_id = %s and l.status = 'ativa';
            """,
            (usuario_id,),
        )
        return {r["menu_codigo"] for r in cur.fetchall()}


def require_menu(*menu_codigos: str):
    """Dependency factory: 403 se o usuario autenticado nao tem NENHUM dos
    menus informados liberado (um so basta). Uso:
    Depends(require_menu(MENU_LICENCIAMENTO_PRODUTOS)) ou, para um recurso
    compartilhado por duas telas, Depends(require_menu(MENU_A, MENU_B))."""

    def _dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        with get_conn() as conn:
            menus = get_menus_liberados(conn, user.id)
        if not menus.intersection(menu_codigos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu perfil de acesso nao tem permissao para esta area do portal",
            )
        return user

    return _dependency
