import { api } from "./client";
import type { ConciliacaoSintetico, LancamentoAnalitico, Overview } from "./types";

export interface ConciliacoesFilter {
  cliente_id?: string;
  cnpj_id?: string;
  ano?: number;
  mes?: number;
  status?: string;
}

function toQuery(filter: ConciliacoesFilter): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export interface MeProfile {
  id: string;
  email: string | null;
  nome: string | null;
  cliente_id: string | null;
  is_admin: boolean;
  menus: string[];
}

export const adminApi = {
  me: () => api.get<MeProfile>("/admin/me"),
  overview: () => api.get<Overview>("/admin/overview"),
  listConciliacoes: (filter: ConciliacoesFilter = {}) =>
    api.get<ConciliacaoSintetico[]>(`/admin/conciliacoes${toQuery(filter)}`),
  listLancamentos: (conciliacaoId: string) =>
    api.get<LancamentoAnalitico[]>(`/admin/conciliacoes/${conciliacaoId}/lancamentos`),
};
