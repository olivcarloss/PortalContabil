import { api } from "./client";
import type { ConciliacaoSintetico, LancamentoAnalitico } from "./types";

export const accountingApi = {
  listConciliacoes: () => api.get<ConciliacaoSintetico[]>("/accounting/conciliacoes"),
  listLancamentos: (conciliacaoId: string) =>
    api.get<LancamentoAnalitico[]>(`/accounting/conciliacoes/${conciliacaoId}/lancamentos`),
  listMeusModulos: () => api.get<string[]>("/accounting/meus-modulos"),
};
