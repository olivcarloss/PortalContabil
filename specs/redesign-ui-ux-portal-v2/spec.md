# Spec: Redesign de navegação e UI/UX do Portal IA-Cloude (v2 — linguagem RodriSaas)

## Contexto e problema

Um redesign completo do Portal (Tailwind, sidebar aninhada, componentes de
design system, dashboards com KPI) foi construído e depois revertido a
pedido do usuário (tag `v0.1.0-portal-licenciamento`). Em seguida, uma
landing page para o produto fictício "RodriSaas" foi construída
(`/rodrisaas`) com uma linguagem visual premium validada pelo usuário:
paleta monocromática preto/branco/cinza, tipografia Inter, gradiente sutil
reservado para acentos, CSS próprio sem framework. O pedido agora é retomar
a reestruturação revertida do Portal, mas aplicando essa linguagem visual
da RodriSaas em vez da paleta roxa usada na primeira tentativa — e sem
reintroduzir Tailwind, usando CSS próprio como na RodriSaas.

## Critérios de aceite (verificáveis)

Idênticos aos do redesign original (`specs/redesign-ui-ux-portal/spec.md`
na branch `feat/redesign-ui-ux-portal`, preservada como referência
estrutural), com a paleta/tipografia substituídas:

- [ ] Toda sub-tela hoje acessada por aba dentro de Licenciamento vira item
      próprio na sidebar, aninhado sob "Licenciamento", com rota própria
      (`/licenciamento/produtos`, `/clientes`, `/usuarios`, `/perfis`).
- [ ] Navegar direto para a URL de uma sub-tela abre a tela correta sem
      passar por Licenciamento primeiro.
- [ ] `theme/global.css` é reescrito com a paleta monocromática da
      RodriSaas (preto/branco/cinza + gradiente sutil violeta→azul restrito
      a acentos) e tipografia Inter, substituindo a paleta roxa/`Sora`+`DM
      Sans` atual. **Sem Tailwind** — CSS próprio, mesmo padrão usado em
      `rodrisaas.css`.
- [ ] Um conjunto de componentes de design system próprio (Button, Card,
      Badge, Table, Field/FieldRow, Tabs, Modal, StatCard) é criado com
      classes CSS próprias (não Tailwind) e reutilizado em todas as telas.
- [ ] Cada tela principal ganha cabeçalho com KPIs/indicadores, igual
      especificado no redesign original.
- [ ] 100% de paridade funcional com o Portal atual (pós-reversão) — todo
      CRUD, convite de usuário, ativação de licença, Portal Contábil
      continuam funcionando de ponta a ponta.
- [ ] Nenhuma chamada de API muda de contrato.
- [ ] `npx tsc -b --noEmit` e `npm run build` seguem limpos.

## Fora de escopo

Igual ao redesign original: busca global/command palette, dark mode,
animações/micro-interações complexas, qualquer mudança de backend,
simplificar/remover fluxos existentes.

Adicionalmente fora de escopo nesta v2: reaproveitar código da branch
Tailwind (`feat/redesign-ui-ux-portal`) — serve só como referência de
estrutura/seções, não de implementação (classes Tailwind não se aplicam
a um projeto sem Tailwind instalado).

## Contratos de dados

Sem mudança de API. Mesma estrutura de rotas do redesign original
(`/licenciamento/produtos`, `/clientes`, `/usuarios`, `/perfis`).

## Decisões tomadas e alternativas rejeitadas

- **Retomar o redesign revertido com nova linguagem visual, em vez de só
  trocar cores na estrutura atual** — escolhido explicitamente pelo
  usuário: a reestruturação de navegação (sidebar aninhada, rotas
  próprias) continua válida, só a linguagem visual muda.
- **CSS próprio (como a RodriSaas), não Tailwind** — escolhido
  explicitamente pelo usuário, para manter consistência com o que já foi
  construído e não reintroduzir a dependência que o usuário reverteu.
- **Paleta monocromática da RodriSaas reaproveitada como está** — em vez
  de criar uma paleta nova para o Portal, reaproveita exatamente a
  paleta/tipografia já validada visualmente na landing page, garantindo
  consistência de marca entre os dois artefatos.

## Riscos / questões em aberto

- O componente de design system precisa ser reconstruído do zero em CSS
  puro (a versão Tailwind não é reaproveitável) — mesmo volume de trabalho
  do redesign original, com a vantagem de já ter o padrão visual definido
  e testado na RodriSaas.
- Nenhuma outra questão em aberto.
