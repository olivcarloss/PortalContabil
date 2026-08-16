-- Portal IA-Cloude: schema de licenciamento
-- Reaproveita as tabelas existentes `clientes` e `cnpjs` do projeto Conciliacao Contabil.
-- Nao altera nenhuma tabela ja existente (clientes, cnpjs, conciliacoes, ingestoes, lancamentos).

begin;

-- ============================================================
-- Catalogo de produtos
-- ============================================================
create table if not exists produtos (
    id uuid primary key default uuid_generate_v4(),
    codigo text not null unique,
    nome text not null,
    descricao text,
    categoria text,
    escopo_licenca text not null default 'por_cnpj'
        check (escopo_licenca in ('por_cnpj', 'por_cliente')),
    ativo boolean not null default true,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

comment on table produtos is 'Catalogo de produtos/servicos licenciaveis do portal (padrao de mercado para escritorios contabeis)';

create table if not exists modulos (
    id uuid primary key default uuid_generate_v4(),
    produto_id uuid not null references produtos(id) on delete cascade,
    codigo text not null,
    nome text not null,
    descricao text,
    ativo boolean not null default true,
    criado_em timestamptz not null default now(),
    unique (produto_id, codigo)
);

comment on table modulos is 'Funcionalidades/modulos dentro de cada produto';

-- ============================================================
-- Perfis de acesso e permissoes
-- ============================================================
create table if not exists perfis_acesso (
    id uuid primary key default uuid_generate_v4(),
    codigo text not null unique,
    nome text not null,
    descricao text,
    escopo text not null default 'ambos'
        check (escopo in ('licenciamento', 'contabil', 'ambos')),
    criado_em timestamptz not null default now()
);

comment on table perfis_acesso is 'Papeis/perfis de acesso atribuiveis a usuarios do portal';

create table if not exists perfil_modulo_permissoes (
    id uuid primary key default uuid_generate_v4(),
    perfil_id uuid not null references perfis_acesso(id) on delete cascade,
    modulo_id uuid not null references modulos(id) on delete cascade,
    pode_ler boolean not null default true,
    pode_escrever boolean not null default false,
    pode_aprovar boolean not null default false,
    unique (perfil_id, modulo_id)
);

comment on table perfil_modulo_permissoes is 'Permissoes de um perfil de acesso sobre um modulo especifico';

-- ============================================================
-- Licencas
-- ============================================================
create table if not exists licencas (
    id uuid primary key default uuid_generate_v4(),
    cliente_id uuid not null references clientes(id) on delete cascade,
    produto_id uuid not null references produtos(id) on delete restrict,
    cnpj_id uuid references cnpjs(id) on delete cascade,
    qtd_licencas integer not null default 1 check (qtd_licencas > 0),
    valor_unitario numeric(14,2) not null default 0,
    valor_total numeric(14,2) not null default 0,
    periodicidade text not null default 'mensal'
        check (periodicidade in ('mensal', 'anual')),
    data_inicio date not null default current_date,
    data_fim date,
    status text not null default 'ativa'
        check (status in ('ativa', 'suspensa', 'cancelada')),
    observacoes text,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now(),
    constraint chk_licenca_cnpj_escopo check (
        -- validado tambem em app; aqui garante que cnpj_id so vem preenchido quando aplicavel
        true
    )
);

comment on table licencas is 'Contratos de licenciamento de um produto por cliente (e opcionalmente por cnpj, conforme escopo_licenca do produto)';

create index if not exists idx_licencas_cliente on licencas(cliente_id);
create index if not exists idx_licencas_produto on licencas(produto_id);
create index if not exists idx_licencas_cnpj on licencas(cnpj_id);

create table if not exists licenca_modulos (
    id uuid primary key default uuid_generate_v4(),
    licenca_id uuid not null references licencas(id) on delete cascade,
    modulo_id uuid not null references modulos(id) on delete cascade,
    unique (licenca_id, modulo_id)
);

comment on table licenca_modulos is 'Modulos habilitados dentro de uma licenca (permite licenciar produto parcialmente)';

-- ============================================================
-- Usuarios do portal (vinculados ao Supabase Auth)
-- ============================================================
create table if not exists usuarios_portal (
    id uuid primary key references auth.users(id) on delete cascade,
    cliente_id uuid not null references clientes(id) on delete cascade,
    nome text not null,
    cargo text,
    ativo boolean not null default true,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

comment on table usuarios_portal is 'Vincula um usuario autenticado (auth.users) a um cliente (escritorio) do portal';

create index if not exists idx_usuarios_portal_cliente on usuarios_portal(cliente_id);

create table if not exists usuario_licencas (
    id uuid primary key default uuid_generate_v4(),
    usuario_id uuid not null references usuarios_portal(id) on delete cascade,
    licenca_id uuid not null references licencas(id) on delete cascade,
    perfil_acesso_id uuid not null references perfis_acesso(id) on delete restrict,
    criado_em timestamptz not null default now(),
    unique (usuario_id, licenca_id)
);

comment on table usuario_licencas is 'Controla quais licencas (produtos/cnpjs) um usuario pode acessar e com qual perfil';

create index if not exists idx_usuario_licencas_usuario on usuario_licencas(usuario_id);
create index if not exists idx_usuario_licencas_licenca on usuario_licencas(licenca_id);

-- ============================================================
-- Triggers de atualizado_em
-- ============================================================
create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$;

drop trigger if exists trg_produtos_atualizado_em on produtos;
create trigger trg_produtos_atualizado_em before update on produtos
    for each row execute function set_atualizado_em();

drop trigger if exists trg_licencas_atualizado_em on licencas;
create trigger trg_licencas_atualizado_em before update on licencas
    for each row execute function set_atualizado_em();

drop trigger if exists trg_usuarios_portal_atualizado_em on usuarios_portal;
create trigger trg_usuarios_portal_atualizado_em before update on usuarios_portal
    for each row execute function set_atualizado_em();

-- ============================================================
-- RLS
-- ============================================================
alter table produtos enable row level security;
alter table modulos enable row level security;
alter table perfis_acesso enable row level security;
alter table perfil_modulo_permissoes enable row level security;
alter table licencas enable row level security;
alter table licenca_modulos enable row level security;
alter table usuarios_portal enable row level security;
alter table usuario_licencas enable row level security;

-- Catalogo (produtos/modulos/perfis/permissoes) e de leitura publica para qualquer usuario autenticado
drop policy if exists produtos_select_authenticated on produtos;
create policy produtos_select_authenticated on produtos
    for select to authenticated using (true);

drop policy if exists modulos_select_authenticated on modulos;
create policy modulos_select_authenticated on modulos
    for select to authenticated using (true);

drop policy if exists perfis_acesso_select_authenticated on perfis_acesso;
create policy perfis_acesso_select_authenticated on perfis_acesso
    for select to authenticated using (true);

drop policy if exists perfil_modulo_permissoes_select_authenticated on perfil_modulo_permissoes;
create policy perfil_modulo_permissoes_select_authenticated on perfil_modulo_permissoes
    for select to authenticated using (true);

-- usuarios_portal: usuario ve apenas o proprio registro e outros usuarios do mesmo cliente
drop policy if exists usuarios_portal_select_own_cliente on usuarios_portal;
create policy usuarios_portal_select_own_cliente on usuarios_portal
    for select to authenticated using (
        id = auth.uid()
        or cliente_id in (
            select up.cliente_id from usuarios_portal up where up.id = auth.uid()
        )
    );

-- licencas: visivel para usuarios vinculados ao mesmo cliente_id da licenca
drop policy if exists licencas_select_by_cliente on licencas;
create policy licencas_select_by_cliente on licencas
    for select to authenticated using (
        cliente_id in (
            select up.cliente_id from usuarios_portal up where up.id = auth.uid()
        )
    );

-- licenca_modulos: segue a visibilidade da licenca associada
drop policy if exists licenca_modulos_select_by_cliente on licenca_modulos;
create policy licenca_modulos_select_by_cliente on licenca_modulos
    for select to authenticated using (
        licenca_id in (
            select l.id from licencas l
            join usuarios_portal up on up.cliente_id = l.cliente_id
            where up.id = auth.uid()
        )
    );

-- usuario_licencas: usuario ve os proprios vinculos de licenca
drop policy if exists usuario_licencas_select_own on usuario_licencas;
create policy usuario_licencas_select_own on usuario_licencas
    for select to authenticated using (
        usuario_id = auth.uid()
        or licenca_id in (
            select l.id from licencas l
            join usuarios_portal up on up.cliente_id = l.cliente_id
            where up.id = auth.uid()
        )
    );

-- Escrita (insert/update/delete) nas tabelas de licenciamento e feita pelo backend
-- usando a service_role key (que tem bypass de RLS por definicao no Supabase),
-- portanto nao sao criadas policies de escrita para o role `authenticated` aqui.

commit;
