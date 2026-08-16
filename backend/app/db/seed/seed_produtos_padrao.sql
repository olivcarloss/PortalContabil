-- Seed: catalogo padrao de produtos, modulos e perfis de acesso
-- para escritorios de contabilidade.

begin;

-- ============================================================
-- Produtos
-- ============================================================
insert into produtos (codigo, nome, descricao, categoria, escopo_licenca) values
    ('ESCRITURACAO', 'Escrituração Contábil e Fiscal', 'Escrituração contábil, apuração de impostos e obrigações fiscais mensais', 'Contábil', 'por_cnpj'),
    ('DEPARTAMENTO_PESSOAL', 'Departamento Pessoal / Folha', 'Folha de pagamento, admissões, rescisões e obrigações trabalhistas (eSocial)', 'Pessoal', 'por_cnpj'),
    ('BPO_FINANCEIRO', 'BPO Financeiro', 'Gestão de contas a pagar/receber e fluxo de caixa terceirizado', 'Financeiro', 'por_cnpj'),
    ('ABERTURA_BAIXA', 'Abertura e Baixa de Empresas', 'Constituição, alteração contratual e encerramento de empresas', 'Societário', 'por_cnpj'),
    ('CONSULTORIA_TRIBUTARIA', 'Consultoria Tributária', 'Planejamento tributário e consultoria fiscal especializada', 'Consultoria', 'por_cliente'),
    ('CERTIFICADO_DIGITAL', 'Certificado Digital', 'Emissão, renovação e gestão de certificados digitais A1/A3', 'Documentação', 'por_cnpj'),
    ('CONCILIACAO_CONTABIL', 'Conciliação Contábil', 'Importação, conciliação e relatórios de lançamentos contábeis por CNPJ', 'Contábil', 'por_cnpj'),
    ('PORTAL_CLIENTE', 'Portal do Cliente', 'Acesso self-service do cliente a documentos, relatórios e solicitações', 'Relacionamento', 'por_cliente'),
    ('EMISSAO_NF', 'Emissão de Notas Fiscais', 'Emissão e gestão de notas fiscais eletrônicas (NF-e, NFS-e)', 'Fiscal', 'por_cnpj'),
    ('OBRIGACOES_ACESSORIAS', 'Gestão de Obrigações Acessórias (SPED)', 'Geração e transmissão de SPED Fiscal, ECD, ECF e demais obrigações acessórias', 'Fiscal', 'por_cnpj')
on conflict (codigo) do nothing;

-- ============================================================
-- Modulos do produto Conciliação Contábil (ja existe como app em producao)
-- ============================================================
insert into modulos (produto_id, codigo, nome, descricao)
select p.id, m.codigo, m.nome, m.descricao
from produtos p
cross join (values
    ('IMPORTACAO_EXTRATOS', 'Importação de Extratos', 'Ingestão de extratos bancários e arquivos de origem'),
    ('CONCILIACAO_AUTOMATICA', 'Conciliação Automática', 'Motor de conciliação automática de lançamentos'),
    ('RELATORIO_SINTETICO', 'Relatório Sintético', 'Visão consolidada de conciliações por período'),
    ('RELATORIO_ANALITICO', 'Relatório Analítico', 'Detalhamento de lançamentos por conta contábil')
) as m(codigo, nome, descricao)
where p.codigo = 'CONCILIACAO_CONTABIL'
on conflict (produto_id, codigo) do nothing;

-- Modulos basicos para os demais produtos (Cadastro + Relatorios)
insert into modulos (produto_id, codigo, nome, descricao)
select p.id, m.codigo, m.nome, m.descricao
from produtos p
cross join (values
    ('CADASTRO', 'Cadastro', 'Cadastros e dados básicos do produto'),
    ('RELATORIOS', 'Relatórios', 'Relatórios e indicadores do produto')
) as m(codigo, nome, descricao)
where p.codigo <> 'CONCILIACAO_CONTABIL'
on conflict (produto_id, codigo) do nothing;

-- ============================================================
-- Perfis de acesso padrao
-- ============================================================
insert into perfis_acesso (codigo, nome, descricao, escopo) values
    ('ADMIN_ESCRITORIO', 'Administrador do Escritório', 'Acesso total à gestão de licenças, usuários e produtos do escritório', 'ambos'),
    ('CONTADOR', 'Contador', 'Acesso operacional completo aos módulos contábeis licenciados', 'contabil'),
    ('ASSISTENTE', 'Assistente', 'Acesso de leitura e lançamento, sem permissões de aprovação', 'contabil'),
    ('CLIENTE_FINAL', 'Cliente Final', 'Acesso restrito de consulta aos próprios dados via Portal do Cliente', 'contabil')
on conflict (codigo) do nothing;

commit;
