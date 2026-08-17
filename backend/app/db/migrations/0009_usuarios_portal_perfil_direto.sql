-- O menu-permissionamento (0008) foi construido em cima de usuario_licencas,
-- que exige um licenca_id (NOT NULL). Isso amarrou incorretamente o acesso
-- a MENUS do portal (uma propriedade do usuario/perfil) a existencia de uma
-- licenca ativa no escritorio — um escritorio sem nenhuma licenca ativa faz
-- qualquer usuario novo, de qualquer perfil, cair em "sem acesso configurado",
-- mesmo que o perfil libere Portal Contabil.
--
-- Corrige adicionando o perfil de acesso diretamente em usuarios_portal,
-- como a fonte de verdade para MENUS. usuario_licencas continua existindo
-- e sendo usada como esta, para o controle fino por MODULO dentro de uma
-- licenca especifica (get_modulos_liberados / get_cnpjs_liberados) — isso
-- sim faz sentido depender de uma licenca ativa.

begin;

alter table usuarios_portal
    add column if not exists perfil_acesso_id uuid references perfis_acesso(id) on delete set null;

-- Backfill: usuarios existentes herdam o perfil de algum vinculo ja existente.
update usuarios_portal up
set perfil_acesso_id = sub.perfil_acesso_id
from (
    select distinct on (usuario_id) usuario_id, perfil_acesso_id
    from usuario_licencas
    order by usuario_id, criado_em desc
) sub
where sub.usuario_id = up.id
  and up.perfil_acesso_id is null;

commit;
