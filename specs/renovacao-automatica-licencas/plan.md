# Plan — Renovação automática de vigência das licenças

> spec.md approved.

## Branch and delivery

- **Branch:** `feat/renovacao-automatica-licencas` (base: `develop`)
- **PR slicing:** single PR — one migration, one small shared helper, and
  three call sites plus one UI badge; no independent slices worth
  splitting.

## Technical approach

A single reusable function `renovar_licencas_vencidas(conn)` in a new
`app/modules/licensing/renovacao.py` runs one batch `UPDATE` (as specified
in spec.md's data contract) that extends every `ativa` + expired license's
`data_fim` and stamps `ultima_renovacao_em`, committing before the caller's
own query runs. It's called at the top of the three read paths identified
in the spec: `GET /licensing/licencas`, the admin overview query, and the
Portal Contábil access checks (`get_cnpjs_liberados`/
`get_modulos_liberados`). No new abstraction beyond this one function —
each call site just adds one line before its existing query (SoC: the
renewal logic lives in one place, call sites stay unaware of the mechanics).

## Affected files (by layer)

| Layer | File | Change |
|---|---|---|
| Migration | `backend/app/db/migrations/0005_licencas_ultima_renovacao.sql` | `alter table licencas add column if not exists ultima_renovacao_em timestamptz;` |
| Domain logic | `backend/app/modules/licensing/renovacao.py` (novo) | `renovar_licencas_vencidas(conn) -> int`, executa o UPDATE em lote do spec.md e `conn.commit()`. |
| Schema | `backend/app/schemas/licensing.py` | `Licenca` ganha `ultima_renovacao_em: datetime \| None = None`. |
| Router | `backend/app/modules/licensing/router.py` | `list_licencas` (e variantes) chama `renovar_licencas_vencidas(conn)` antes do `SELECT`. |
| Router | `backend/app/modules/admin/router.py` | `overview` chama `renovar_licencas_vencidas(conn)` antes de montar as agregações. |
| Access check | `backend/app/modules/accounting/access.py` | `get_cnpjs_liberados`/`get_modulos_liberados` chamam `renovar_licencas_vencidas(conn)` antes de suas queries. |
| Types (frontend) | `frontend/src/api/types.ts` | `Licenca` ganha `ultima_renovacao_em: string \| null`. |
| UI | `frontend/src/components/produto/AtivacoesTab.tsx` | Mostra "Renovada automaticamente em DD/MM/AAAA HH:MM" quando `ultima_renovacao_em` estiver preenchido. |

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Chamar `renovar_licencas_vencidas` em múltiplos endpoints por request pode rodar o UPDATE mais vezes que o necessário numa mesma sessão de uso | Aceito conscientemente: o UPDATE só afeta linhas realmente vencidas (`WHERE data_fim < current_date`), então chamadas repetidas em requests distintos são baratas e idempotentes — não otimizar prematuramente (YAGNI), conforme já flagged no spec. |
| Cálculo `ceil` com `periodicidade = 'anual'` usando 365 dias fixos pode divergir levemente de anos bissextos ao longo de muitos ciclos | Aceito: o erro máximo é de poucos dias por várias renovações consecutivas não lidas por anos — impacto desprezível dado o caso de uso (portal interno, não cobrança automatizada de terceiros). |

## Rollback and reversibility

- Migração: `alter table ... add column if not exists` é aditiva e
  reversível — `downgrade` seria `alter table licencas drop column
  ultima_renovacao_em;` (não há dados a perder além do próprio rastro de
  renovação, aceitável de descartar).
- Reversal plan: reverter o PR é suficiente. A extensão de `data_fim`
  feita durante o período em que a feature esteve ativa não é desfeita
  automaticamente ao reverter o código — se isso for um problema, é uma
  decisão manual do admin (fora de escopo de rollback automático).

## Testing strategy

- Unit: `renovar_licencas_vencidas` com um `conn`/cursor fake ou contra uma
  transação de teste, cobrindo: licença mensal vencida há 1 ciclo, licença
  anual vencida há vários ciclos (catch-up), licença `suspensa` vencida
  (não deve renovar), licença com `data_fim = null` (não deve renovar).
- Integration: chamada real ao endpoint `GET /licensing/licencas` contra o
  Supabase de teste, com uma licença de teste vencida, confirmando que
  `data_fim` avança e `ultima_renovacao_em` é preenchido na resposta.
- E2E: não aplicável — validação manual da badge na tela de Ativações,
  registrada no Test Plan do PR.
