-- Permissionamento de acesso a menus/submenus do portal por perfil de acesso.
-- Mesma forma de perfil_modulo_permissoes (que ja controla, dentro de um
-- produto licenciado, quais modulos um perfil libera), mas para as secoes
-- do proprio portal (Visao Geral, Produtos, Escritorios, Usuarios, Perfis,
-- Portal Contabil, etc.) em vez de modulos de um produto.
--
-- menu_codigo nao referencia outra tabela: e um enum fixo definido no
-- codigo da aplicacao (ver MENU_CODES em app/modules/licensing/menus.py),
-- entao nao ha uma tabela "menus" para dar FK.

begin;

create table if not exists perfil_menu_permissoes (
    id uuid primary key default gen_random_uuid(),
    perfil_id uuid not null references perfis_acesso(id) on delete cascade,
    menu_codigo text not null,
    unique (perfil_id, menu_codigo)
);

-- Seed a partir do campo "escopo" ja existente, para nao quebrar o acesso de
-- usuarios atuais no instante em que o enforcement por menu entra em vigor
-- (sem isso, todo perfil comecaria sem NENHUM menu liberado). E so um ponto
-- de partida — revise/ajuste pelas telas de Perfis de acesso depois.
insert into perfil_menu_permissoes (perfil_id, menu_codigo)
select id, 'portal_contabil' from perfis_acesso where escopo in ('contabil', 'ambos')
on conflict do nothing;

insert into perfil_menu_permissoes (perfil_id, menu_codigo)
select id, menu_codigo
from perfis_acesso, unnest(array[
    'licenciamento_visao_geral',
    'licenciamento_produtos',
    'licenciamento_escritorios',
    'licenciamento_usuarios',
    'licenciamento_perfis'
]) as menu_codigo
where escopo in ('licenciamento', 'ambos')
on conflict do nothing;

commit;
