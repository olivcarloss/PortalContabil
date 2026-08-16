# Tasks — Renovação automática de vigência das licenças

> Persistent memory between sessions. When starting a new session, read this file + `spec.md`
> and check out the branch below before anything else.
> Legend: `[ ]` pending · `[~]` in progress · `[x]` done.

**Branch:** `feat/renovacao-automatica-licencas` (base: `develop`)

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

- [x] Create `backend/app/db/migrations/0005_licencas_ultima_renovacao.sql` (`alter table licencas add column if not exists ultima_renovacao_em timestamptz;`) and apply it to the live Supabase project — done when: `select ultima_renovacao_em from licencas limit 1;` succeeds against the real database. *(Applied live and verified.)*
- [x] Create `backend/app/modules/licensing/renovacao.py` with `renovar_licencas_vencidas(conn) -> int`, running the batch `UPDATE` from spec.md and committing — done when: unit tests cover (1) mensal license expired 1 cycle ago extends by 1 month, (2) anual license expired multiple cycles ago catches up to today, (3) `suspensa` license is left untouched, (4) `data_fim = null` license is left untouched. *(4 unit tests on the SQL contract + a live throwaway-license test against real Postgres confirming a 3-month-overdue mensal license correctly catches up to a future data_fim; row cleaned up after.)*
- [x] Add `ultima_renovacao_em: datetime | None = None` to the `Licenca` schema in `backend/app/schemas/licensing.py` — done when: import succeeds and the field appears in `GET /licensing/licencas` responses.
- [x] Call `renovar_licencas_vencidas(conn)` at the top of `list_licencas` (and its filtered variants) in `backend/app/modules/licensing/router.py` — done when: manual test — a test license with a past `data_fim` and `status='ativa'` gets its `data_fim` extended on the next `GET /licensing/licencas` call.
- [x] Call `renovar_licencas_vencidas(conn)` at the top of `overview` in `backend/app/modules/admin/router.py` — done when: same test license, when read via `GET /admin/overview`, is also renewed.
- [x] Call `renovar_licencas_vencidas(conn)` at the top of `get_cnpjs_liberados`/`get_modulos_liberados` in `backend/app/modules/accounting/access.py` — done when: same test license, when read via the Portal Contábil endpoints, is also renewed.
- [ ] Add `ultima_renovacao_em: string | null` to the `Licenca` interface in `frontend/src/api/types.ts` — done when: `npx tsc -b --noEmit` is clean.
- [ ] Show a "Renovada automaticamente em DD/MM/AAAA HH:MM" indicator in `frontend/src/components/produto/AtivacoesTab.tsx` when a license's `ultima_renovacao_em` is set — done when: manual browser check shows the badge for the renewed test license and nothing for a license never auto-renewed.

## Closing (the *close* phase of `dev-lifecycle` — always keep last)

- [ ] Evolve tests/CI to cover the changes — done when: `.github/workflows/ci.yml` pytest job covers `renovacao.py` and stays green
- [ ] Push the branch to origin — done when: branch published (or explicitly skipped again if still no remote — confirm with user)
- [ ] Draft the PR (Summary / Notable Decisions / Test Plan, in English) and **pause for approval** — done when: user approved title + description

## Done

