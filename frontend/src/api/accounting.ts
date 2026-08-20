import { api } from "./client";
import type { ConciliacaoSintetico, ContaContabilResumo, LancamentoAnalitico, MeuProdutoLicenciado } from "./types";

export const accountingApi = {
  listConciliacoes: () => api.get<ConciliacaoSintetico[]>("/accounting/conciliacoes"),
  listLancamentos: (conciliacaoId: string) =>
    api.get<LancamentoAnalitico[]>(`/accounting/conciliacoes/${conciliacaoId}/lancamentos`),
  listContasContabeis: () => api.get<ContaContabilResumo[]>("/accounting/contas-contabeis"),
  listMeusModulos: () => api.get<string[]>("/accounting/meus-modulos"),
  listMeusProdutos: () => api.get<MeuProdutoLicenciado[]>("/accounting/meus-produtos"),
  enviarRelatorioEmail: (payload: {
    destinatarios: string[];
    titulo: string;
    formato: "csv" | "xlsx" | "pdf";
    colunas: string[];
    linhas: string[][];
  }) => api.post<{ enviado: boolean }>("/accounting/relatorios/enviar-email", payload),
};
