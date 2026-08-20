-- Marca o escritorio/CNPJ administrativos (bootstrap do usuario master,
-- ver app/modules/admin/router.py:_ensure_admin_escritorio) como "interno",
-- para poderem ser filtrados de listagens, relatorios e contagens visiveis
-- ao usuario — eles existem so para satisfazer a FK NOT NULL de
-- usuarios_portal.cliente_id, nao sao um escritorio/cliente real.

begin;

alter table clientes add column if not exists interno boolean not null default false;

update clientes set interno = true where nome = 'IA-Cloude — Administração';

commit;
