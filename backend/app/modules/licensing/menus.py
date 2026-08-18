"""Catalogo fixo de menus/submenus do portal, usados como unidade de
permissionamento por perfil de acesso (perfil_menu_permissoes).

Um usuario enxerga/acessa um menu se: (a) usuarios_portal.papel == 'master'
(bypass total, superusuario da plataforma), OU (b) o perfil_acesso_id
gravado diretamente em usuarios_portal inclui esse menu_codigo em
perfil_menu_permissoes.

Importante: isso e independente de o escritorio ter alguma licenca ativa —
menu e uma propriedade do usuario/perfil, nao de uma licenca especifica.
(usuario_licencas continua existindo e sendo usada separadamente para
controle fino por MODULO dentro de uma licenca, ex. get_modulos_liberados —
esse sim depende legitimamente de haver uma licenca ativa.)
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
MENU_RELATORIO_SINTETICO = "relatorio_sintetico"
MENU_RELATORIO_ANALITICO = "relatorio_analitico"
MENU_RELATORIO_ESCRITORIOS = "relatorio_escritorios"
MENU_RELATORIO_CLIENTES = "relatorio_clientes"
MENU_RELATORIO_PRODUTOS = "relatorio_produtos"
MENU_RELATORIO_MODULOS = "relatorio_modulos"
MENU_RELATORIO_TABELA_PRECOS = "relatorio_tabela_precos"

MENU_LABELS: dict[str, str] = {
    MENU_ADMIN_VISAO_GERAL: "One Page de Produtos",
    MENU_ADMIN_CONCILIACAO: "Conciliação (admin)",
    MENU_LICENCIAMENTO_VISAO_GERAL: "Licenciamento — Visão geral",
    MENU_LICENCIAMENTO_PRODUTOS: "Licenciamento — Produtos",
    MENU_LICENCIAMENTO_ESCRITORIOS: "Licenciamento — Escritórios",
    MENU_LICENCIAMENTO_USUARIOS: "Licenciamento — Usuários",
    MENU_LICENCIAMENTO_PERFIS: "Licenciamento — Perfis de acesso",
    MENU_PORTAL_CONTABIL: "Portal Contábil",
    MENU_RELATORIO_SINTETICO: "Relatórios — Sintético",
    MENU_RELATORIO_ANALITICO: "Relatórios — Analítico",
    MENU_RELATORIO_ESCRITORIOS: "Relatórios — Escritórios",
    MENU_RELATORIO_CLIENTES: "Relatórios — Clientes",
    MENU_RELATORIO_PRODUTOS: "Relatórios — Produtos",
    MENU_RELATORIO_MODULOS: "Relatórios — Módulos",
    MENU_RELATORIO_TABELA_PRECOS: "Relatórios — Tabela de Preços",
}

ALL_MENU_CODES: list[str] = list(MENU_LABELS)


def get_menus_liberados(conn, usuario_id: str) -> set[str]:
    """Menus que o usuario pode acessar. papel == 'master' sempre libera tudo."""
    with conn.cursor() as cur:
        cur.execute(
            "select papel, perfil_acesso_id from usuarios_portal where id = %s;",
            (usuario_id,),
        )
        row = cur.fetchone()
        if row is None:
            return set()
        if row["papel"] == "master":
            return set(ALL_MENU_CODES)
        if row["perfil_acesso_id"] is None:
            return set()

        cur.execute(
            "select menu_codigo from perfil_menu_permissoes where perfil_id = %s;",
            (row["perfil_acesso_id"],),
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
