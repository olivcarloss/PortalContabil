-- Campos de contato no cadastro de "clientes" (CNPJs atendidos por um escritorio),
-- necessarios para o cadastro completo pedido: CNPJ, razao social, nome fantasia,
-- e-mail e telefone.

begin;

alter table cnpjs add column if not exists email_contato text;
alter table cnpjs add column if not exists telefone text;

commit;
