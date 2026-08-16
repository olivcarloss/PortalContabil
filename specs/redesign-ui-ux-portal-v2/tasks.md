# Tasks — Redesign v2 (linguagem RodriSaas, CSS próprio)

**Branch:** `feat/redesign-ui-ux-portal-v2` (base: `feat/convite-usuario-por-email`)

## Tasks

### Foundation
- [ ] Rewrite `theme/global.css` with the RodriSaas monochrome palette + Inter, keeping existing `--color-*` variable names so nothing breaks mid-migration — done when: `npm run build` clean, visually confirms new palette.
- [ ] Build `components/ui/{Button,Badge,Card,Table,Field,Tabs,Modal,StatCard}.tsx` with plain CSS classes (no Tailwind) — done when: tsc clean.

### Navigation
- [ ] Rewrite `Shell.tsx` with nested "Portal de Licenciamento" sidebar section + `App.tsx` nested routes — done when: tsc/build clean.

### Licensing pages
- [ ] OverviewTab, ProdutosPage, ClientesPage, UsuariosPage, PerfisPage — restyled + KPI headers, remove LicensingHome.tsx.

### Shared components
- [ ] Restyle AtivacoesTab, ModulosTab.

### Admin + Accounting + Login
- [ ] Restyle VisaoGeral, Conciliacao, AccountingHome, Login.

### Closing
- [ ] Full functional pass + live API sweep.
- [ ] CI/tests gate.
- [ ] Push/PR — skip (no remote).
