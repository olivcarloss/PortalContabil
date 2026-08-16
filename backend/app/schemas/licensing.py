from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ClienteBase(BaseModel):
    nome: str
    email_contato: str | None = None
    ativo: bool = True


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = None
    email_contato: str | None = None
    ativo: bool | None = None


class Cliente(ClienteBase):
    id: UUID
    criado_em: datetime
    atualizado_em: datetime


class CnpjBase(BaseModel):
    cliente_id: UUID
    cnpj: str
    razao_social: str
    nome_fantasia: str | None = None
    email_contato: str | None = None
    telefone: str | None = None
    ativo: bool = True


class CnpjCreate(CnpjBase):
    pass


class CnpjUpdate(BaseModel):
    cnpj: str | None = None
    razao_social: str | None = None
    nome_fantasia: str | None = None
    email_contato: str | None = None
    telefone: str | None = None
    ativo: bool | None = None


class Cnpj(CnpjBase):
    id: UUID
    criado_em: datetime
    atualizado_em: datetime


class ProdutoBase(BaseModel):
    codigo: str
    nome: str
    descricao: str | None = None
    categoria: str | None = None
    escopo_licenca: str = Field(pattern="^(por_cnpj|por_cliente)$")
    ativo: bool = True


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    categoria: str | None = None
    ativo: bool | None = None


class Produto(ProdutoBase):
    id: UUID
    criado_em: datetime
    atualizado_em: datetime


class Modulo(BaseModel):
    id: UUID
    produto_id: UUID
    codigo: str
    nome: str
    descricao: str | None = None
    ativo: bool
    valor_execucao: float = 0


class ModuloCreate(BaseModel):
    codigo: str
    nome: str
    descricao: str | None = None
    valor_execucao: float = Field(default=0, ge=0)
    ativo: bool = True


class ModuloUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    valor_execucao: float | None = Field(default=None, ge=0)
    ativo: bool | None = None


class PerfilAcesso(BaseModel):
    id: UUID
    codigo: str
    nome: str
    descricao: str | None = None
    escopo: str
    ativo: bool = True
    modulo_ids: list[UUID] = Field(default_factory=list)


class PerfilAcessoCreate(BaseModel):
    codigo: str
    nome: str
    descricao: str | None = None
    escopo: str = Field(default="ambos", pattern="^(licenciamento|contabil|ambos)$")
    modulo_ids: list[UUID] = Field(default_factory=list)


class PerfilAcessoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    escopo: str | None = Field(default=None, pattern="^(licenciamento|contabil|ambos)$")
    ativo: bool | None = None
    modulo_ids: list[UUID] | None = None


class LicencaBase(BaseModel):
    cliente_id: UUID
    produto_id: UUID
    cnpj_id: UUID | None = None
    qtd_licencas: int = Field(default=1, gt=0)
    valor_unitario: float = 0
    valor_total: float = 0
    periodicidade: str = Field(default="mensal", pattern="^(mensal|anual)$")
    data_inicio: date
    data_fim: date | None = None
    status: str = Field(default="ativa", pattern="^(ativa|suspensa|cancelada)$")
    observacoes: str | None = None
    modulo_ids: list[UUID] = Field(default_factory=list)


class LicencaCreate(LicencaBase):
    pass


class Licenca(LicencaBase):
    id: UUID
    criado_em: datetime
    atualizado_em: datetime
    ultima_renovacao_em: datetime | None = None


class LicencaUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(ativa|suspensa|cancelada)$")
    valor_unitario: float | None = None
    valor_total: float | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    qtd_licencas: int | None = Field(default=None, gt=0)
    observacoes: str | None = None
    modulo_ids: list[UUID] | None = None


class UsuarioPortalBase(BaseModel):
    id: UUID  # auth.users.id
    cliente_id: UUID
    nome: str
    cargo: str | None = None
    ativo: bool = True


class UsuarioConviteCreate(BaseModel):
    nome: str
    email: str
    cliente_id: UUID
    perfil_acesso_id: UUID


class UsuarioPortal(UsuarioPortalBase):
    criado_em: datetime
    atualizado_em: datetime
    convite_status: str = "ativo"


class UsuarioLicencaCreate(BaseModel):
    usuario_id: UUID
    licenca_id: UUID
    perfil_acesso_id: UUID


class UsuarioLicenca(UsuarioLicencaCreate):
    id: UUID
    criado_em: datetime
