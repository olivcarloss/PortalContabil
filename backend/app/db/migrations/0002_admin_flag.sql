-- Adiciona um flag de administrador da plataforma, para telas que enxergam
-- dados de todos os clientes (Visao Geral / Conciliacao), fora do isolamento
-- multi-tenant por licenca usado no Portal Contabil normal.

begin;

alter table usuarios_portal add column if not exists is_admin boolean not null default false;

commit;
