# Plan — Convite de usuário por e-mail

> spec.md approved.

## Branch and delivery

- **Branch:** `feat/convite-usuario-por-email` (base: `develop`)
- **Pré-requisito de kickoff:** o projeto ainda não é um repositório git
  (`git status` confirma "not a git repository"). O `dev-lifecycle` kickoff
  precisa rodar `git init` + primeiro commit do estado atual antes de criar
  a branch da feature — sinalizado aqui, não bloqueia a aprovação do plano.
- **PR slicing:** single PR — a feature é pequena (1 endpoint novo + 1
  endpoint alterado + 1 formulário reescrito), não há camadas independentes
  que justifiquem split.

## Technical approach

Backend ganha um módulo fino `app/core/supabase_admin.py` que encapsula as
duas chamadas REST à Supabase Admin API (criar usuário com convite; listar
usuários por lote para status) usando `httpx` (já é dependência do projeto,
usado em `security.py`) e `settings.supabase_service_role_key` (já
configurado). O router de licensing ganha o endpoint novo
`POST /licensing/usuarios/convite` que orquestra: chamar a Admin API →
tratar duplicidade como sucesso (reaproveitar id) → gravar
`usuarios_portal` + `usuario_licencas` na mesma função, sem transação
distribuída (é tudo no mesmo Postgres, um único `with get_conn()`). O
endpoint antigo `POST /licensing/usuarios` e o schema `UsuarioPortalCreate`
são removidos — nada mais no projeto os usa. `GET /licensing/usuarios` passa
a enriquecer cada linha com `convite_status` numa segunda chamada em lote à
Admin API. No frontend, `NovoUsuarioModal` é reescrito com os 4 campos
novos e a tabela ganha a coluna de status de convite.

## Affected files (by layer)

| Layer | File | Change |
|---|---|---|
| Admin API client | `backend/app/core/supabase_admin.py` (novo) | Funções `invite_user(email, nome) -> (id, is_new)` e `get_users_status(ids) -> dict[id, "pendente"\|"ativo"]`, usando `httpx` + `settings.supabase_service_role_key`/`supabase_url`. Trata erro de e-mail duplicado da Admin API como caminho de sucesso (busca o usuário existente por e-mail). |
| Schema | `backend/app/schemas/licensing.py` | Remove `UsuarioPortalCreate`. Adiciona `UsuarioConviteCreate` (nome, email, cliente_id, perfil_acesso_id) e adiciona `convite_status: str` em `UsuarioPortal`. |
| Router | `backend/app/modules/licensing/router.py` | Remove `create_usuario` (rota antiga). Adiciona `POST /licensing/usuarios/convite` usando `supabase_admin.invite_user` + inserts em `usuarios_portal`/`usuario_licencas`. Atualiza `list_todos_usuarios`/`list_usuarios` para chamar `supabase_admin.get_users_status` e popular `convite_status`. |
| API client (frontend) | `frontend/src/api/licensing.ts` | Remove `createUsuario`. Adiciona `convidarUsuario(payload)` chamando `POST /licensing/usuarios/convite`. |
| Types (frontend) | `frontend/src/api/types.ts` | `UsuarioPortal` ganha `convite_status: "pendente" \| "ativo"`. |
| UI | `frontend/src/pages/licensing/UsuariosTab.tsx` | `NovoUsuarioModal` reescrito: campos nome/email/escritório/perfil (perfil obrigatório), sem campo de UUID. Tabela ganha coluna/badge de status do convite. |

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Projeto ainda não é repositório git | `dev-lifecycle` kickoff roda `git init` + commit inicial do estado atual antes de criar a branch da feature. |
| Admin API não expõe um jeito direto de "buscar por e-mail" na v1 (pode exigir listar e filtrar) | Confirmar no `supabase_admin.py`: se não houver endpoint de busca por e-mail, cair para `GET /auth/v1/admin/users?email=...` (suportado) ou, na ausência, listar página única e filtrar client-side — implementação decide na hora, sem mudar o contrato do endpoint. |
| Chamada em lote de status pode ficar lenta se a lista de usuários crescer | Fora de escopo agora (already flagged as risk aceito no spec); não otimizar prematuramente (YAGNI). |

## Rollback and reversibility

- Sem migração de schema (nenhuma tabela nova ou coluna nova no Postgres —
  `usuarios_portal`/`usuario_licencas` já existem e são reaproveitadas como
  estão).
- Reversal plan: reverter o PR é suficiente — nenhuma alteração
  destrutiva de dados; a única superfície nova é o endpoint e o form.

## Testing strategy

- Unit: `supabase_admin.invite_user`/`get_users_status`, com o `httpx` client
  mockado, cobrindo caminho de sucesso, duplicidade e erro genérico.
- Integration: `POST /licensing/usuarios/convite` fim a fim contra um
  usuário de teste real no projeto Supabase (criar, confirmar
  `usuarios_portal`/`usuario_licencas`, depois limpar o usuário de teste).
- E2E: não aplicável (sem suíte E2E no projeto ainda) — validação manual do
  fluxo convite → e-mail → login, registrada no Test Plan do PR.
- Sem meta de cobertura formal (projeto não tem suíte de testes automatizada
  hoje); os testes acima são o mínimo necessário para este endpoint crítico
  de segurança/acesso.
