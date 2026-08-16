-- Valor de execucao por modulo (usado para compor o valor de uma licenca
-- quando módulos especificos sao habilitados) e permite cadastro/atualizacao
-- independente do valor total da licenca.

begin;

alter table modulos add column if not exists valor_execucao numeric(14,2) not null default 0;

commit;
