-- Excluir um modulo referenciado por licencas/permissoes nao deve apagar
-- silenciosamente o historico (cascade); o backend trata isso com soft
-- delete quando ha referencias, entao a FK precisa bloquear (restrict)
-- para o ForeignKeyViolation ser detectado, igual ja acontece com produtos.

begin;

alter table licenca_modulos
    drop constraint licenca_modulos_modulo_id_fkey,
    add constraint licenca_modulos_modulo_id_fkey
        foreign key (modulo_id) references modulos(id) on delete restrict;

alter table perfil_modulo_permissoes
    drop constraint perfil_modulo_permissoes_modulo_id_fkey,
    add constraint perfil_modulo_permissoes_modulo_id_fkey
        foreign key (modulo_id) references modulos(id) on delete restrict;

commit;
