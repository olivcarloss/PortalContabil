-- Planos de contas reais costumam separar Custo de Despesa (6 grupos, nao
-- 5): Ativo, Passivo, Patrimonio Liquido, Receita, Custo, Despesa.

begin;

alter table plano_contas drop constraint plano_contas_tipo_check;
alter table plano_contas add constraint plano_contas_tipo_check
    check (tipo in ('ativo', 'passivo', 'receita', 'custo', 'despesa', 'patrimonio_liquido'));

commit;
