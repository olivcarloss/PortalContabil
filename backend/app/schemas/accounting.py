from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class ConciliacaoSintetico(BaseModel):
    conciliacao_id: UUID
    cliente_id: UUID
    cliente_nome: str
    cnpj_id: UUID
    cnpj: str
    razao_social: str
    ano: int
    mes: int
    status: str
    origem: str | None = None
    arquivo_origem: str | None = None
    total_debitos: float | None = None
    total_creditos: float | None = None
    saldo_final: float | None = None
    qtd_lancamentos: int | None = None
    recebido_em: datetime | None = None


class OverviewProduto(BaseModel):
    produto_id: UUID
    produto_nome: str
    categoria: str | None = None
    clientes_licenciados: int
    licencas_ativas: int
    mrr: float


class OverviewCliente(BaseModel):
    cliente_id: UUID
    cliente_nome: str
    ativo: bool
    total_cnpjs: int
    produtos_ativos: list[str]
    licencas_ativas: int
    mrr: float


class OverviewCnpj(BaseModel):
    cnpj_id: UUID
    cliente_id: UUID
    cliente_nome: str
    cnpj: str
    razao_social: str
    ativo: bool
    produtos_ativos: list[str]
    mrr: float


class OverviewStatusConciliacao(BaseModel):
    status: str
    total: int


class OverviewProdutoStatus(BaseModel):
    produto_id: UUID
    produto_nome: str
    finalizados: int
    nao_finalizados: int


class Overview(BaseModel):
    total_clientes: int
    clientes_ativos: int
    total_cnpjs: int
    total_licencas_ativas: int
    mrr_total: float
    total_usuarios_ativos: int
    por_produto: list[OverviewProduto]
    por_cliente: list[OverviewCliente]
    por_cnpj: list[OverviewCnpj]
    status_conciliacoes: list[OverviewStatusConciliacao]
    status_por_produto: list[OverviewProdutoStatus]


class MeuProdutoLicenciado(BaseModel):
    licenca_id: UUID
    produto_id: UUID
    produto_nome: str
    produto_codigo: str
    categoria: str | None = None
    status: str
    periodicidade: str
    data_inicio: date
    data_fim: date | None = None
    valor_total: float
    cnpj_id: UUID | None = None
    cnpj: str | None = None
    razao_social: str | None = None
    nome_fantasia: str | None = None


class LancamentoAnalitico(BaseModel):
    lancamento_id: UUID
    cliente_id: UUID
    cliente_nome: str
    cnpj_id: UUID
    cnpj: str
    razao_social: str
    ano: int
    mes: int
    data_lancamento: date | None = None
    conta_contabil: str | None = None
    historico: str | None = None
    documento: str | None = None
    valor_debito: float | None = None
    valor_credito: float | None = None
    saldo: float | None = None
    conciliado: bool | None = None
    observacao: str | None = None
