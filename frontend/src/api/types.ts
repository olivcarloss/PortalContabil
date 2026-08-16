export interface Cliente {
  id: string;
  nome: string;
  email_contato: string | null;
  ativo: boolean;
}

export interface Cnpj {
  id: string;
  cliente_id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email_contato: string | null;
  telefone: string | null;
  ativo: boolean;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  escopo_licenca: "por_cnpj" | "por_cliente";
  ativo: boolean;
}

export interface Modulo {
  id: string;
  produto_id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  valor_execucao: number;
}

export interface PerfilAcesso {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  escopo: string;
}

export interface UsuarioPortal {
  id: string;
  cliente_id: string;
  nome: string;
  cargo: string | null;
  ativo: boolean;
  convite_status: "pendente" | "ativo";
}

export interface Licenca {
  id: string;
  cliente_id: string;
  produto_id: string;
  cnpj_id: string | null;
  qtd_licencas: number;
  valor_unitario: number;
  valor_total: number;
  periodicidade: "mensal" | "anual";
  data_inicio: string;
  data_fim: string | null;
  status: "ativa" | "suspensa" | "cancelada";
  observacoes: string | null;
  modulo_ids: string[];
  ultima_renovacao_em: string | null;
}

export interface ConciliacaoSintetico {
  conciliacao_id: string;
  cliente_id: string;
  cliente_nome: string;
  cnpj_id: string;
  cnpj: string;
  razao_social: string;
  ano: number;
  mes: number;
  status: string;
  total_debitos: number | null;
  total_creditos: number | null;
  saldo_final: number | null;
  qtd_lancamentos: number | null;
}

export interface OverviewProduto {
  produto_id: string;
  produto_nome: string;
  categoria: string | null;
  clientes_licenciados: number;
  licencas_ativas: number;
  mrr: number;
}

export interface OverviewCliente {
  cliente_id: string;
  cliente_nome: string;
  ativo: boolean;
  total_cnpjs: number;
  produtos_ativos: string[];
  licencas_ativas: number;
  mrr: number;
}

export interface OverviewStatusConciliacao {
  status: string;
  total: number;
}

export interface OverviewProdutoStatus {
  produto_id: string;
  produto_nome: string;
  finalizados: number;
  nao_finalizados: number;
}

export interface OverviewCnpj {
  cnpj_id: string;
  cliente_id: string;
  cliente_nome: string;
  cnpj: string;
  razao_social: string;
  ativo: boolean;
  produtos_ativos: string[];
  mrr: number;
}

export interface Overview {
  total_clientes: number;
  clientes_ativos: number;
  total_cnpjs: number;
  total_licencas_ativas: number;
  mrr_total: number;
  total_usuarios_ativos: number;
  por_produto: OverviewProduto[];
  por_cliente: OverviewCliente[];
  por_cnpj: OverviewCnpj[];
  status_conciliacoes: OverviewStatusConciliacao[];
  status_por_produto: OverviewProdutoStatus[];
}

export interface LancamentoAnalitico {
  lancamento_id: string;
  data_lancamento: string | null;
  conta_contabil: string | null;
  historico: string | null;
  documento: string | null;
  valor_debito: number | null;
  valor_credito: number | null;
  saldo: number | null;
  conciliado: boolean | null;
}
