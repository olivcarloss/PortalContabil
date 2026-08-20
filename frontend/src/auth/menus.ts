// Espelha backend/app/modules/licensing/menus.py — mesmos codigos.
export const MENU_ADMIN_VISAO_GERAL = "admin_visao_geral";
export const MENU_ADMIN_CONCILIACAO = "admin_conciliacao";
export const MENU_LICENCIAMENTO_VISAO_GERAL = "licenciamento_visao_geral";
export const MENU_LICENCIAMENTO_PRODUTOS = "licenciamento_produtos";
export const MENU_LICENCIAMENTO_ESCRITORIOS = "licenciamento_escritorios";
export const MENU_LICENCIAMENTO_USUARIOS = "licenciamento_usuarios";
export const MENU_LICENCIAMENTO_PERFIS = "licenciamento_perfis";
export const MENU_LICENCIAMENTO_PLANO_CONTAS = "licenciamento_plano_contas";
export const MENU_PORTAL_CONTABIL = "portal_contabil";
export const MENU_RELATORIO_SINTETICO = "relatorio_sintetico";
export const MENU_RELATORIO_ANALITICO = "relatorio_analitico";
export const MENU_RELATORIO_ESCRITORIOS = "relatorio_escritorios";
export const MENU_RELATORIO_CLIENTES = "relatorio_clientes";
export const MENU_RELATORIO_PRODUTOS = "relatorio_produtos";
export const MENU_RELATORIO_MODULOS = "relatorio_modulos";
export const MENU_RELATORIO_TABELA_PRECOS = "relatorio_tabela_precos";
export const MENU_RELATORIO_PLANO_CONTAS = "relatorio_plano_contas";
export const MENU_RELATORIO_CONTAS_CONTABEIS = "relatorio_contas_contabeis";

export const MENU_LABELS: Record<string, string> = {
  [MENU_ADMIN_VISAO_GERAL]: "One Page de Produtos",
  [MENU_ADMIN_CONCILIACAO]: "Conciliação (admin)",
  [MENU_LICENCIAMENTO_VISAO_GERAL]: "Licenciamento — Visão geral",
  [MENU_LICENCIAMENTO_PRODUTOS]: "Licenciamento — Produtos",
  [MENU_LICENCIAMENTO_ESCRITORIOS]: "Licenciamento — Escritórios",
  [MENU_LICENCIAMENTO_USUARIOS]: "Licenciamento — Usuários",
  [MENU_LICENCIAMENTO_PERFIS]: "Licenciamento — Perfis de acesso",
  [MENU_LICENCIAMENTO_PLANO_CONTAS]: "Licenciamento — Plano de Contas",
  [MENU_PORTAL_CONTABIL]: "Portal Contábil",
  [MENU_RELATORIO_SINTETICO]: "Relatórios — Sintético",
  [MENU_RELATORIO_ANALITICO]: "Relatórios — Analítico",
  [MENU_RELATORIO_ESCRITORIOS]: "Relatórios — Escritórios",
  [MENU_RELATORIO_CLIENTES]: "Relatórios — Clientes",
  [MENU_RELATORIO_PRODUTOS]: "Relatórios — Produtos",
  [MENU_RELATORIO_MODULOS]: "Relatórios — Módulos",
  [MENU_RELATORIO_TABELA_PRECOS]: "Relatórios — Tabela de Preços",
  [MENU_RELATORIO_PLANO_CONTAS]: "Relatórios — Plano de Contas",
  [MENU_RELATORIO_CONTAS_CONTABEIS]: "Relatórios — Contas Contábeis",
};

export const ALL_MENU_CODES = Object.keys(MENU_LABELS);
