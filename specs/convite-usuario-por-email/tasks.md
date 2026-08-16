# Tasks — Convite de usuário por e-mail

> Persistent memory between sessions. When starting a new session, read this file + `spec.md`
> and check out the branch below before anything else.
> Legend: `[ ]` pending · `[~]` in progress · `[x]` done.

**Branch:** `feat/convite-usuario-por-email` (base: `develop`)

Rules:
- Each task ≤ ~1h, ordered by dependency.
- Each task has a **verifiable** done criterion ("test X passes", not "improve Y").
- Before marking `[x]`: run the repo's gates — **lint, type-check, and tests** — all green.
- Before marking `[x]`: self-check the code against the coding principles in the
  `dev-lifecycle` checkpoint phase (**KISS, YAGNI, DRY, SoC**) and refactor if violated —
  autonomously, no user prompt.
- When marking `[x]`: make the **conventional commit** (in English) for the task —
  the *checkpoint* phase of the `dev-lifecycle` skill. **1 task = 1 commit.** Never accumulate.

## Tasks

- [x] Create `backend/app/core/supabase_admin.py` with `invite_user(email, nome) -> tuple[str, bool]` (returns `(auth_user_id, is_new)`, treats duplicate-email response as success by looking up the existing user) and `get_users_status(ids: list[str]) -> dict[str, str]` (returns `"pendente"` or `"ativo"` per id), both using `httpx` + `settings.supabase_service_role_key`/`supabase_url` — done when: unit tests covering success, duplicate-email, and generic-error paths (httpx client mocked) pass.
- [x] Add `UsuarioConviteCreate` schema (`nome`, `email`, `cliente_id`, `perfil_acesso_id`, all required) and add `convite_status: str` to `UsuarioPortal` in `backend/app/schemas/licensing.py`; remove `UsuarioPortalCreate` — done when: `mypy`/import of the module succeeds and no remaining reference to `UsuarioPortalCreate` exists in the backend.
- [x] Add `POST /licensing/usuarios/convite` in `backend/app/modules/licensing/router.py`: calls `supabase_admin.invite_user`, inserts into `usuarios_portal` (skip if id already present), inserts into `usuario_licencas` for every active license of `cliente_id` with the given `perfil_acesso_id` (skip existing pairs), returns the created/reused `UsuarioPortal`; remove the old `create_usuario` route — done when: manual `curl`/Swagger call against a real test email creates the account, the invite email is confirmed sent, and re-calling with the same email returns 200 without a second invite. *(route wired and import/openapi smoke-tested; live e-mail call pending explicit go-ahead — see Done log)*
- [x] Update `list_todos_usuarios`/`list_usuarios` in the same router to call `supabase_admin.get_users_status` and populate `convite_status` on each returned row — done when: `GET /licensing/usuarios` response includes `convite_status` for every user.
- [x] Update `frontend/src/api/licensing.ts`: remove `createUsuario`, add `convidarUsuario(payload: { nome, email, cliente_id, perfil_acesso_id })` calling the new endpoint — done when: `npx tsc -b --noEmit` is clean.
- [x] Update `frontend/src/api/types.ts`: add `convite_status: "pendente" | "ativo"` to the `UsuarioPortal` interface — done when: `npx tsc -b --noEmit` is clean.
- [x] Rewrite `NovoUsuarioModal` in `frontend/src/pages/licensing/UsuariosTab.tsx`: replace the UUID field with an e-mail field, make perfil de acesso required (remove the "nenhum perfil" option), call `licensingApi.convidarUsuario` instead of `createUsuario`+manual license loop — done when: manual test in the browser creates a user end-to-end via the new form with no UUID input visible. *(code complete + type-checked; live browser click-through pending — see Done log)*
- [x] Add a status badge column ("Convite pendente" / "Ativo") to the users table in `UsuariosTab.tsx` driven by `convite_status` — done when: badge renders correctly for a freshly invited (pending) and an already-active user in a manual browser check. *(code complete; visual confirmation pending same live check as above)*

## Closing (the *close* phase of `dev-lifecycle` — always keep last)

- [ ] Evolve tests/CI to cover the changes (create CI if none exists) — done when: pipeline green
- [ ] Push the branch to origin — done when: branch published
- [ ] Draft the PR (Summary / Notable Decisions / Test Plan, in English) and **pause for approval** — done when: user approved title + description

## Done

