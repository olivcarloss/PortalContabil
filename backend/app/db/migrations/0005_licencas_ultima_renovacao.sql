-- Rastro de renovacao automatica de vigencia (data_fim) das licencas.

begin;

alter table licencas add column if not exists ultima_renovacao_em timestamptz;

commit;
