from pydantic import BaseModel, EmailStr, Field


class ContatoForm(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    email: EmailStr
    escritorio: str | None = Field(default=None, max_length=200)
    assunto: str | None = Field(default=None, max_length=200)
    mensagem: str = Field(min_length=1, max_length=4000)
