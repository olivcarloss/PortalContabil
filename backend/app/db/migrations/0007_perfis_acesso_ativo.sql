-- Flag de soft-delete para perfis de acesso, necessaria para permitir
-- editar/excluir um perfil (mesmo padrao ja usado em produtos/modulos):
-- exclusao tenta apagar de verdade e cai para inativar se o perfil ja
-- estiver em uso (usuario_licencas.perfil_acesso_id e on delete restrict).

begin;

alter table perfis_acesso add column if not exists ativo boolean not null default true;

commit;
