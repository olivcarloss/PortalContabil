-- Plano de contas: cada escritorio (cliente) pode carregar o proprio (via
-- upload de XLS), e existe um plano padrao global (cliente_id null),
-- carregado pelo master, usado por qualquer escritorio que nao tenha
-- carregado o proprio.
--
-- A validacao contra o plano acontece via trigger em `lancamentos`, nao no
-- backend, porque lancamentos sao inseridos por um processo externo (fora
-- desta API — nao ha nenhum endpoint POST /lancamentos neste repositorio).
-- A trigger so bloqueia quando ja existe ALGUM plano aplicavel (proprio do
-- escritorio, ou o padrao global); sem nenhum plano cadastrado ainda, nada
-- e bloqueado, para nao quebrar a ingestao existente no dia em que esta
-- migration for aplicada.

begin;

create table plano_contas (
    id uuid primary key default uuid_generate_v4(),
    cliente_id uuid references clientes(id) on delete cascade,
    codigo text not null,
    descricao text not null,
    tipo text not null check (tipo in ('ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido')),
    criado_em timestamptz not null default now()
);

comment on column plano_contas.cliente_id is 'null = plano padrao global (fallback para escritorios sem plano proprio)';

create unique index idx_plano_contas_cliente_codigo
    on plano_contas (cliente_id, codigo) nulls not distinct;

create index idx_plano_contas_cliente on plano_contas (cliente_id);

create or replace function fn_validar_conta_contabil() returns trigger as $$
declare
    v_cliente_id uuid;
    v_tem_plano_proprio boolean;
    v_tem_plano_padrao boolean;
    v_ok boolean;
begin
    if new.conta_contabil is null then
        return new;
    end if;

    select cl.id into v_cliente_id
    from cnpjs cn join clientes cl on cl.id = cn.cliente_id
    where cn.id = new.cnpj_id;

    if v_cliente_id is null then
        return new;
    end if;

    select exists(select 1 from plano_contas where cliente_id = v_cliente_id) into v_tem_plano_proprio;

    if v_tem_plano_proprio then
        select exists(
            select 1 from plano_contas where cliente_id = v_cliente_id and codigo = new.conta_contabil
        ) into v_ok;
    else
        select exists(select 1 from plano_contas where cliente_id is null) into v_tem_plano_padrao;
        if not v_tem_plano_padrao then
            return new; -- nenhum plano cadastrado ainda (nem proprio, nem padrao): nao bloqueia
        end if;
        select exists(
            select 1 from plano_contas where cliente_id is null and codigo = new.conta_contabil
        ) into v_ok;
    end if;

    if not v_ok then
        raise exception 'Conta contabil "%" nao encontrada no plano de contas do escritorio (nem no plano padrao)', new.conta_contabil;
    end if;

    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_validar_conta_contabil on lancamentos;
create trigger trg_validar_conta_contabil
    before insert or update of conta_contabil, cnpj_id on lancamentos
    for each row execute function fn_validar_conta_contabil();

commit;
