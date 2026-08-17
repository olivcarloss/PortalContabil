// Espelha backend/app/modules/licensing/menus.py — mesmos codigos.
export const MENU_ADMIN_VISAO_GERAL = "admin_visao_geral";
export const MENU_ADMIN_CONCILIACAO = "admin_conciliacao";
export const MENU_LICENCIAMENTO_VISAO_GERAL = "licenciamento_visao_geral";
export const MENU_LICENCIAMENTO_PRODUTOS = "licenciamento_produtos";
export const MENU_LICENCIAMENTO_ESCRITORIOS = "licenciamento_escritorios";
export const MENU_LICENCIAMENTO_USUARIOS = "licenciamento_usuarios";
export const MENU_LICENCIAMENTO_PERFIS = "licenciamento_perfis";
export const MENU_PORTAL_CONTABIL = "portal_contabil";

export const MENU_LABELS: Record<string, string> = {
  [MENU_ADMIN_VISAO_GERAL]: "One Page de Produtos",
  [MENU_ADMIN_CONCILIACAO]: "Conciliação (admin)",
  [MENU_LICENCIAMENTO_VISAO_GERAL]: "Licenciamento — Visão geral",
  [MENU_LICENCIAMENTO_PRODUTOS]: "Licenciamento — Produtos",
  [MENU_LICENCIAMENTO_ESCRITORIOS]: "Licenciamento — Escritórios",
  [MENU_LICENCIAMENTO_USUARIOS]: "Licenciamento — Usuários",
  [MENU_LICENCIAMENTO_PERFIS]: "Licenciamento — Perfis de acesso",
  [MENU_PORTAL_CONTABIL]: "Portal Contábil",
};

export const ALL_MENU_CODES = Object.keys(MENU_LABELS);
