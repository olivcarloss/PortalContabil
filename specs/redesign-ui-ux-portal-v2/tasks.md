# Tasks — Redesign v2 (linguagem RodriSaas, CSS próprio)

**Branch:** `feat/redesign-ui-ux-portal-v2` (base: `feat/convite-usuario-por-email`)

## Tasks

### Foundation
- [x] Rewrite `theme/global.css` with the RodriSaas monochrome palette + Inter, keeping existing `--color-*` variable names so nothing breaks mid-migration — done when: `npm run build` clean, visually confirms new palette. *(Compiled CSS confirmed: `--color-primary:#0a0a0a`. index.html font link + favicon updated to match. theme/index.ts values updated too, for consistency even though unused in JS.)*
- [x] Build `components/ui/{Button,Badge,Card,Table,Field,Tabs,Modal,StatCard}.tsx` with plain CSS classes (no Tailwind) — done when: tsc clean. *(Thin wrappers over the existing global.css classes. Old components/Modal.tsx moved to components/ui/Modal.tsx, all 6 call sites updated.)*

### Navigation
- [x] Rewrite `Shell.tsx` with nested "Portal de Licenciamento" sidebar section + `App.tsx` nested routes — done when: tsc/build clean. *(Same structure as the reverted Tailwind redesign. LicensingHome.tsx removed, now unreferenced.)*

### Licensing pages
- [x] OverviewTab, ProdutosTab, ClientesTab, UsuariosTab, PerfisTab — routed via nested sidebar; Produtos/Clientes/Usuários got KPI headers (StatCard) — done when: tsc/build clean. *(Kept original file names — `*Tab.tsx`, not renamed to `*Page.tsx` like the Tailwind version, since renaming wasn't required by this spec. The monochrome palette already cascades to every page via the shared `--color-*`/`.card`/`.btn`/`.badge-*` classes — no per-page rewrite needed for that part, confirmed by grep.)*

### Shared components
- [x] AtivacoesTab, ModulosTab — done when: tsc/build clean. *(No code change needed: both already use `.card`/`.btn`/`var(--color-*)`, so the palette cascades automatically. Verified via grep — no separate commit.)*

### Admin + Accounting + Login
- [x] VisaoGeral, Conciliacao — done when: tsc/build clean. *(No code change needed, same cascade reasoning as above — both already use `.stat-card`/`.card`/`.badge-*`/`var(--color-*)` exclusively.)*
- [x] AccountingHome — done when: tsc/build clean. *(Added a KPI header: total conciliações + status breakdown via StatusChart, matching the spec's "cada tela principal ganha KPIs" criterion.)*
- [x] Login — done when: tsc/build clean. *(No code change needed, same cascade reasoning.)*

### Closing
- [x] Full functional pass + live API sweep — done when: all endpoints healthy. *(All 8 endpoints the redesigned pages depend on verified live: 200. Backend untouched by this branch (confirmed via git diff) beyond the earlier psycopg fix already on develop.)*
- [x] CI/tests gate — done when: green. *(8/8 backend pytest tests pass; tsc/build clean at every commit in this branch.)*
- [ ] Push/PR — skipped, same as every prior feature this session: no git remote configured yet.
