# Plan — Redesign v2 (linguagem RodriSaas, CSS próprio)

## Branch and delivery

- **Branch:** `feat/redesign-ui-ux-portal-v2` (base: `feat/convite-usuario-por-email`,
  a branch de trabalho combinada atual — mesma razão do redesign original:
  evita reconciliar duas reescritas grandes depois).
- **PR slicing:** single PR, reescrita completa de uma vez (mesma decisão
  do redesign original).

## Technical approach

Reescreve `theme/global.css` com a paleta monocromática + Inter da
RodriSaas (tokens `--color-*` renomeados para os valores novos, mantendo
os mesmos nomes de variável para não quebrar nenhum `var(--color-*)`
espalhado pelo código). Cria `components/ui/` em CSS puro (classes BEM-like
próprias, ex. `.ui-btn`, `.ui-card`), espelhando a mesma API de props dos
componentes que existiam na versão Tailwind (para reaproveitar a estrutura
JSX das páginas sem reescrever a lógica). Reestrutura `Shell.tsx`/`App.tsx`
com sidebar aninhada e rotas próprias, igual ao redesign original. Migra as
mesmas páginas, na mesma ordem, adicionando cabeçalhos de KPI.

## Affected files

Mesma lista do redesign original (`specs/redesign-ui-ux-portal/plan.md` na
branch `feat/redesign-ui-ux-portal`), com a única troca sendo: sem
`tailwind.config.ts`/`postcss.config.js`; `components/ui/*.tsx` usam
classes CSS próprias em vez de utilitários Tailwind; `theme/global.css`
evolui em vez de ser substituído por diretivas Tailwind.

## Testing strategy

Igual ao redesign original: `tsc`/`build` a cada tarefa, verificação
funcional manual por tela, sem testes de UI automatizados (não existem no
projeto).
