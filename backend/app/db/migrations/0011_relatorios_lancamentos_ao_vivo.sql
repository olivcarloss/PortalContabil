-- As tabelas clientes/cnpjs/conciliacoes/lancamentos e as views abaixo sao
-- da parte de Portal Contabil/conciliacao, criadas fora do historico de
-- migrations deste repositorio (pre-existentes ao controle de versao). Esta
-- migration passa a versionar as duas views usadas pelos relatorios
-- Sintetico e Analitico.
--
-- vw_conciliacoes_sintetico existia, mas guardava total_debitos/
-- total_creditos/saldo_final/qtd_lancamentos como colunas cacheadas em
-- `conciliacoes`, sem nenhum processo golpeando esse cache quando
-- `lancamentos` muda. Passa a agregar direto de `lancamentos`.
--
-- vw_lancamentos_analitico nao existia (a tela Analitico dependia dela e
-- quebrava com "relation does not exist"). Criada do zero.

begin;

drop view if exists vw_conciliacoes_sintetico;

create view vw_conciliacoes_sintetico as
select
    c.id as conciliacao_id,
    cl.id as cliente_id,
    cl.nome as cliente_nome,
    cn.id as cnpj_id,
    cn.cnpj,
    cn.razao_social,
    c.ano,
    c.mes,
    c.status,
    c.origem,
    c.arquivo_origem,
    coalesce(sum(l.valor_debito), 0) as total_debitos,
    coalesce(sum(l.valor_credito), 0) as total_creditos,
    coalesce(sum(l.valor_credito) - sum(l.valor_debito), 0) as saldo_final,
    count(l.id) as qtd_lancamentos,
    c.recebido_em
from conciliacoes c
join cnpjs cn on cn.id = c.cnpj_id
join clientes cl on cl.id = cn.cliente_id
left join lancamentos l on l.conciliacao_id = c.id
group by
    c.id, cl.id, cl.nome, cn.id, cn.cnpj, cn.razao_social,
    c.ano, c.mes, c.status, c.origem, c.arquivo_origem, c.recebido_em;

create or replace view vw_lancamentos_analitico as
select
    l.id as lancamento_id,
    cl.id as cliente_id,
    cl.nome as cliente_nome,
    cn.id as cnpj_id,
    cn.cnpj,
    cn.razao_social,
    c.ano,
    c.mes,
    l.data_lancamento,
    l.conta_contabil,
    l.historico,
    l.documento,
    l.valor_debito,
    l.valor_credito,
    coalesce(l.valor_credito, 0) - coalesce(l.valor_debito, 0) as saldo,
    (l.status = 'processado') as conciliado,
    l.observacao
from lancamentos l
join conciliacoes c on c.id = l.conciliacao_id
join cnpjs cn on cn.id = l.cnpj_id
join clientes cl on cl.id = cn.cliente_id;

commit;
