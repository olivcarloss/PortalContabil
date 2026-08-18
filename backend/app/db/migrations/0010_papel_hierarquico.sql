-- Introduz o eixo "papel" (master | administrador | usuario), que decide o
-- ESCOPO de dados (quais escritorios/CNPJs/produtos/modulos a pessoa
-- alcanca), coexistindo com perfis_acesso/perfil_menu_permissoes (que
-- continua controlando quais TELAS aparecem).
--
-- master        = renomeacao formal do is_admin atual (bypass total).
-- administrador = vinculado a N escritorios via administrador_clientes;
--                 dentro deles, CRUD de CNPJs, leitura de licencas, gestao
--                 de usuarios e concessao de modulos por usuario.
-- usuario       = acesso por allowlist em usuario_modulos (por usuario, nao
--                 mais uniforme por licenca).

begin;

create type papel_usuario as enum ('master', 'administrador', 'usuario');

alter table usuarios_portal
    add column papel papel_usuario not null default 'usuario';

update usuarios_portal set papel = 'master' where is_admin = true;

alter table usuarios_portal drop column is_admin;

create table administrador_clientes (
    usuario_id uuid not null references usuarios_portal(id) on delete cascade,
    cliente_id uuid not null references clientes(id) on delete cascade,
    criado_em timestamptz not null default now(),
    primary key (usuario_id, cliente_id)
);

create table usuario_modulos (
    usuario_id uuid not null references usuarios_portal(id) on delete cascade,
    licenca_id uuid not null references licencas(id) on delete cascade,
    modulo_id uuid not null references modulos(id) on delete cascade,
    criado_em timestamptz not null default now(),
    primary key (usuario_id, licenca_id, modulo_id)
);

-- Backfill: todo mundo mantem exatamente o acesso a modulos que ja tinha
-- (hoje uniforme por licenca) no dia do deploy.
insert into usuario_modulos (usuario_id, licenca_id, modulo_id)
select ul.usuario_id, ul.licenca_id, lm.modulo_id
from usuario_licencas ul
join licenca_modulos lm on lm.licenca_id = ul.licenca_id
on conflict do nothing;

commit;
