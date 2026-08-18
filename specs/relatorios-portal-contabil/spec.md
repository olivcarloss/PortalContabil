# Menu de Relatórios no Portal Contábil

## Contexto e problema

O Portal Contábil (lado do usuário do escritório) hoje só tem "Meus produtos"
e a tela de Conciliação. Falta um menu "Relatórios" com 7 visões: Sintético,
Analítico, Escritórios, Clientes, Produtos, Módulos e Tabela de Preços — cada
um como item de menu próprio, permissionável individualmente por perfil de
acesso (`perfis_acesso`/`perfil_menu_permissoes`), e respeitando o escopo de
papel (master/administrador/usuario) recém-implementado.

## Acceptance criteria

- [ ] 7 novos `menu_codigo` (`relatorio_sintetico`, `relatorio_analitico`,
      `relatorio_escritorios`, `relatorio_clientes`, `relatorio_produtos`,
      `relatorio_modulos`, `relatorio_tabela_precos`), cada um controlável
      independentemente em `perfil_menu_permissoes` — nenhum é liberado por
      padrão para perfis existentes (opt-in).
- [ ] Sidebar ganha um submenu colapsável "Relatórios" dentro da seção do
      Portal Contábil (mesmo padrão visual do submenu "Portal de
      Licenciamento" já existente em `Shell.tsx`), listando só os itens que
      o usuário tem liberado.
- [ ] **Sintético**: lista de conciliações (reaproveita
      `vw_conciliacoes_sintetico`), escopada aos CNPJs liberados do usuário
      (mesma lógica de `require_cnpjs_liberados` já usada em
      `/accounting/conciliacoes`).
- [ ] **Analítico**: lista de lançamentos (reaproveita
      `vw_lancamentos_analitico`) com filtros por CNPJ/ano/mês, escopada aos
      CNPJs liberados do usuário — endpoint novo (hoje só existe por
      `conciliacao_id` específico).
- [ ] **Escritórios**: dados do(s) escritório(s) no escopo do usuário —
      reaproveita a mesma lógica de escopo já usada em `GET /licensing/clientes`.
- [ ] **Clientes**: CNPJs atendidos pelo(s) escritório(s) no escopo —
      endpoint novo que lista CNPJs sem exigir um `cliente_id` fixo
      (agregando todos os escritórios do escopo), análogo ao padrão já usado
      em `list_licencas` para `cliente_id` opcional.
- [ ] **Produtos**: licenças ativas do(s) escritório(s) no escopo —
      reaproveita `GET /licensing/licencas`.
- [ ] **Módulos**: autosserviço — cada usuário vê só os próprios módulos
      liberados (reaproveita `GET /accounting/meus-modulos`, já existente).
      Não agrega por outros usuários do escritório.
- [ ] **Tabela de Preços**: catálogo completo de produtos e módulos com seus
      valores (`valor_execucao`) — reaproveita `GET /licensing/produtos` +
      `GET /licensing/produtos/{id}/modulos`; NÃO é escopado por
      escritório/papel (é referência de catálogo, igual pra todo mundo com
      o menu liberado).
- [ ] Todos os relatórios são somente-leitura (sem criar/editar/excluir).
- [ ] `PerfisTab.tsx` — checklist "Menus liberados" passa a listar os 7 novos
      códigos (já reaproveita `ALL_MENU_CODES`/`MENU_LABELS`, sem trabalho
      extra de UI).

## Fora de escopo

- Exportação (PDF/Excel) dos relatórios — só visualização em tela.
- Dashboards/gráficos — listas/tabelas simples, no mesmo estilo visual das
  telas existentes (`OverviewTab`, `ClientesTab`).
- Alterar os relatórios Sintético/Analítico já existentes do lado
  administrativo (`/admin/conciliacoes`) — ficam como estão; os novos do
  Portal Contábil são endpoints próprios e escopados ao usuário logado.

## Data contracts

Novos endpoints em `backend/app/modules/accounting/router.py` (todos
`Depends(require_menu(MENU_RELATORIO_*))`):

- `GET /accounting/relatorios/sintetico` → `list[ConciliacaoSintetico]`
  (reaproveita schema existente).
- `GET /accounting/relatorios/analitico?cnpj_id=&ano=&mes=` →
  `list[LancamentoAnalitico]` (reaproveita schema existente; filtros
  opcionais, sempre restrito aos CNPJs liberados do usuário).
- `GET /accounting/relatorios/escritorios` → `list[Cliente]`.
- `GET /accounting/relatorios/clientes` → `list[Cnpj]`.
- `GET /accounting/relatorios/produtos` → `list[Licenca]`.
- `GET /accounting/relatorios/modulos` → `list[str]` (códigos de módulo,
  igual ao `/accounting/meus-modulos` já existente — pode até ser o mesmo
  endpoint reexposto sob o novo menu).
- `GET /accounting/relatorios/tabela-precos` → lista de produtos, cada um
  com seus módulos e `valor_execucao` (schema novo, agregando
  `Produto` + `Modulo[]`).

## Edge cases

- Usuário sem nenhum CNPJ liberado → Sintético/Analítico retornam lista
  vazia (não erro), mesmo padrão de `require_cnpjs_liberados`.
- Administrador sem nenhum escritório em `administrador_clientes` →
  Escritórios/Clientes/Produtos retornam lista vazia.
- Menu liberado mas sem licença nenhuma → Produtos/Tabela de Preços mostram
  estado vazio com mensagem, não erro.

## Decisões tomadas

- Fica no Portal Contábil (lado do usuário final), não no Portal de
  Licenciamento — confirmado.
- "Escritórios" ≠ "Clientes": Escritórios = dados do(s) escritório(s) no
  escopo; Clientes = CNPJs atendidos — confirmado, nomenclatura do ponto de
  vista de quem usa o Portal Contábil.
- Produtos = contratados (licenças ativas); Tabela de Preços = catálogo
  geral com valores — confirmado.
- Escopo por papel se aplica a Escritórios/Clientes/Produtos (dados
  específicos de escritório); Tabela de Preços fica global (é referência de
  catálogo) — confirmado implicitamente pela natureza do dado.
- Módulos = autosserviço (só os próprios módulos do usuário logado), não um
  quadro agregado por usuário do escritório — confirmado, rejeitando a
  alternativa de um endpoint agregado novo (mais simples, reaproveita
  `/meus-modulos`).
- 7 `menu_codigo` separados (não 1 único com abas internas) — confirmado,
  permite perfis granulares por relatório.

## Open questions / riscos

Nenhuma pergunta bloqueante restante.
