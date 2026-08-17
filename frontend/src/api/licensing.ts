import { api } from "./client";
import type {
  Cliente,
  Cnpj,
  Licenca,
  Modulo,
  PerfilAcesso,
  Produto,
  UsuarioPortal,
} from "./types";

export const licensingApi = {
  listProdutos: () => api.get<Produto[]>("/licensing/produtos"),
  createProduto: (payload: Partial<Produto>) =>
    api.post<Produto>("/licensing/produtos", payload),
  updateProduto: (
    produtoId: string,
    payload: Partial<Pick<Produto, "nome" | "descricao" | "categoria" | "ativo">>
  ) => api.patch<Produto>(`/licensing/produtos/${produtoId}`, payload),
  deleteProduto: (produtoId: string) =>
    api.delete<{ deleted: boolean; inativado: boolean }>(`/licensing/produtos/${produtoId}`),
  listModulos: (produtoId: string) =>
    api.get<Modulo[]>(`/licensing/produtos/${produtoId}/modulos`),
  createModulo: (
    produtoId: string,
    payload: { codigo: string; nome: string; descricao?: string | null; valor_execucao: number }
  ) => api.post<Modulo>(`/licensing/produtos/${produtoId}/modulos`, payload),
  updateModulo: (
    moduloId: string,
    payload: Partial<Pick<Modulo, "nome" | "descricao" | "valor_execucao" | "ativo">>
  ) => api.patch<Modulo>(`/licensing/modulos/${moduloId}`, payload),
  deleteModulo: (moduloId: string) =>
    api.delete<{ deleted: boolean; inativado: boolean }>(`/licensing/modulos/${moduloId}`),

  listPerfisAcesso: () => api.get<PerfilAcesso[]>("/licensing/perfis-acesso"),
  createPerfilAcesso: (payload: {
    codigo: string;
    nome: string;
    descricao?: string | null;
    escopo: string;
    modulo_ids: string[];
    menu_ids: string[];
  }) => api.post<PerfilAcesso>("/licensing/perfis-acesso", payload),
  updatePerfilAcesso: (
    perfilId: string,
    payload: Partial<
      Pick<PerfilAcesso, "nome" | "descricao" | "escopo" | "ativo" | "modulo_ids" | "menu_ids">
    >
  ) => api.patch<PerfilAcesso>(`/licensing/perfis-acesso/${perfilId}`, payload),
  deletePerfilAcesso: (perfilId: string) =>
    api.delete<{ deleted: boolean; inativado: boolean }>(`/licensing/perfis-acesso/${perfilId}`),

  listClientes: () => api.get<Cliente[]>("/licensing/clientes"),
  createCliente: (payload: Partial<Cliente>) =>
    api.post<Cliente>("/licensing/clientes", payload),
  updateCliente: (clienteId: string, payload: Partial<Pick<Cliente, "nome" | "email_contato" | "ativo">>) =>
    api.patch<Cliente>(`/licensing/clientes/${clienteId}`, payload),
  deleteCliente: (clienteId: string) => api.delete<Cliente>(`/licensing/clientes/${clienteId}`),

  listCnpjs: (clienteId: string) =>
    api.get<Cnpj[]>(`/licensing/clientes/${clienteId}/cnpjs`),
  createCnpj: (payload: Partial<Cnpj>) => api.post<Cnpj>("/licensing/cnpjs", payload),
  updateCnpj: (
    cnpjId: string,
    payload: Partial<Pick<Cnpj, "cnpj" | "razao_social" | "nome_fantasia" | "email_contato" | "telefone" | "ativo">>
  ) => api.patch<Cnpj>(`/licensing/cnpjs/${cnpjId}`, payload),
  deleteCnpj: (cnpjId: string) => api.delete<Cnpj>(`/licensing/cnpjs/${cnpjId}`),

  listLicencas: (filter: { clienteId?: string; produtoId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.clienteId) params.set("cliente_id", filter.clienteId);
    if (filter.produtoId) params.set("produto_id", filter.produtoId);
    const qs = params.toString();
    return api.get<Licenca[]>(`/licensing/licencas${qs ? `?${qs}` : ""}`);
  },
  createLicenca: (payload: Partial<Licenca>) =>
    api.post<Licenca>("/licensing/licencas", payload),
  updateLicenca: (
    licencaId: string,
    payload: Partial<
      Pick<
        Licenca,
        "status" | "valor_unitario" | "valor_total" | "data_inicio" | "data_fim" | "qtd_licencas" | "observacoes" | "modulo_ids"
      >
    >
  ) => api.patch<Licenca>(`/licensing/licencas/${licencaId}`, payload),

  listMinhasLicencas: () => api.get<Licenca[]>("/licensing/me/licencas"),

  listTodosUsuarios: () => api.get<UsuarioPortal[]>("/licensing/usuarios"),
  convidarUsuario: (payload: {
    nome: string;
    email: string;
    senha: string;
    cliente_id: string;
    perfil_acesso_id: string;
  }) => api.post<UsuarioPortal>("/licensing/usuarios/convite", payload),
  updateUsuario: (
    usuarioId: string,
    payload: Partial<Pick<UsuarioPortal, "nome" | "cargo" | "ativo">> & { senha?: string }
  ) => api.patch<UsuarioPortal>(`/licensing/usuarios/${usuarioId}`, payload),
  deleteUsuario: (usuarioId: string) =>
    api.delete<{ deleted: boolean; inativado: boolean }>(`/licensing/usuarios/${usuarioId}`),
  solicitarSenhaUsuario: (usuarioId: string) =>
    api.post<{ enviado: boolean }>(`/licensing/usuarios/${usuarioId}/solicitar-senha`, {}),
};
