# Permissionamento hierárquico: Master → Administrador → Usuário

## Contexto e problema

Hoje o portal tem dois mecanismos de permissão soltos: `usuarios_portal.is_admin`
(bypass total) e `perfis_acesso`/`perfil_menu_permissoes` (controla quais MENUS
cada usuário vê, mas não quem pode gerenciar CNPJs, licenças ou outros usuários
de um escritório específico). Não existe hoje um nível intermediário que
permita a um responsável por um ou mais escritórios administrar CNPJs, ver
licenças e conceder acesso a produtos/módulos para os usuários desses
escritórios, sem depender do Master para cada operação.

Este spec introduz um terceiro eixo — **papel** (`master` | `administrador` |
`usuario`) — que convive com o sistema de `perfis_acesso` já existente:
- **papel** decide o ESCOPO de dados (quais escritórios/CNPJs/produtos/módulos
  a pessoa alcança).
- **perfil_acesso** continua decidindo quais TELAS (menus) aparecem.

## Acceptance criteria

- [ ] `usuarios_portal` ganha uma coluna `papel` (`master` | `administrador` |
      `usuario`), migrada a partir do `is_admin` atual (`true` → `master`,
      `false` → `usuario` por padrão).
- [ ] `is_admin` é removido do schema e de todo o código (substituído por
      `papel == 'master'`); nenhuma referência a `is_admin` sobra no backend
      ou frontend.
- [ ] Nova tabela `administrador_clientes` (usuario_id, cliente_id) — vínculo
      N:N entre um usuário com papel `administrador` e os escritórios que ele
      administra.
- [ ] Nova tabela `usuario_modulos` (usuario_id, licenca_id, modulo_id) —
      concede, por usuário e por licença, quais módulos específicos daquela
      licença ele enxerga (granularidade por usuário, não mais só por
      licença).
- [ ] **Master**: continua com bypass total (`get_menus_liberados` retorna
      todos os menus; acessa todos os escritórios/CNPJs/licenças sem
      restrição de escopo).
- [ ] **Administrador**: dentro dos escritórios listados em
      `administrador_clientes` para ele —
  - [ ] pode listar/criar/editar CNPJs (reaproveita `licenciamento_escritorios`)
  - [ ] pode VISUALIZAR licenças (produto, quantidade, valor, período) mas não
        criar/editar/cancelar (isso continua exclusivo do Master)
  - [ ] pode convidar/editar/desativar Usuários desses escritórios
        (reaproveita `licenciamento_usuarios`, com filtro de escopo)
  - [ ] pode conceder/revogar, por usuário, quais produtos (via
        `usuario_licencas`, já existente) e quais módulos dentro de cada
        produto (via `usuario_modulos`, novo) aquele Usuário acessa
  - [ ] pode promover um Usuário do escritório que administra a
        `administrador` (mas só pode atribuí-lo aos escritórios que ele
        mesmo já administra — não pode conceder acesso a escritórios fora do
        seu próprio escopo)
  - [ ] NÃO pode se promover/promover ninguém a `master`
  - [ ] fora de `administrador_clientes`, não vê nada de outros escritórios
- [ ] **Usuário**: acesso ao Portal Contábil limitado à interseção de
  - [ ] CNPJs cobertos por suas licenças ativas (`usuario_licencas`, já
        existente — sem mudança)
  - [ ] módulos concedidos individualmente em `usuario_modulos` — se não
        houver nenhuma linha em `usuario_modulos` para uma licença do
        usuário, ele não vê módulo nenhum dela (allowlist, não vem tudo por
        padrão)
- [ ] Migração de dados preserva o acesso atual: para cada linha existente em
      `usuario_licencas`, `usuario_modulos` é backfilled com todos os módulos
      já habilitados na respectiva licença (`licenca_modulos`) — ninguém perde
      acesso no dia do deploy.
- [ ] Tela "Usuários" (Licenciamento) ganha um seletor de **papel**
      (Master/Administrador/Usuário) e, quando `administrador`, um
      multi-select de escritórios (popula `administrador_clientes`).
- [ ] Nova tela/aba — escopo do Administrador — para conceder produtos e
      módulos por usuário (dentro dos escritórios que ele administra); Master
      também enxerga essa tela sem restrição de escopo.
- [ ] Backend: toda rota de CNPJs/usuários/licenças (leitura) passa a aceitar
      tanto `papel == 'master'` quanto `papel == 'administrador'` com
      `cliente_id` presente em `administrador_clientes`; mutações em
      licenças continuam exclusivas de `papel == 'master'`.
- [ ] Testes automatizados cobrindo: bypass do Master, escopo do
      Administrador (dentro/fora de `administrador_clientes`), allowlist de
      módulos do Usuário, e a regra de que Administrador não promove a
      Master.

## Fora de escopo

- Mudar o sistema de `perfis_acesso`/menus existente (continua controlando
  telas, sem alteração).
- Auditoria/histórico de quem concedeu o quê (fica para uma fase futura, se
  necessário).
- Administrador editar valores/quantidade de licenças (fica só leitura).
- Qualquer mudança na hierarquia do lado "admin_visao_geral"/"admin_conciliacao"
  (dashboard interno do Master) — esses menus continuam exclusivos de `master`.

## Data contracts

**Migração de schema** (nova migration SQL):
```sql
create type papel_usuario as enum ('master', 'administrador', 'usuario');

alter table usuarios_portal add column papel papel_usuario not null default 'usuario';
update usuarios_portal set papel = 'master' where is_admin = true;
alter table usuarios_portal drop column is_admin;

create table administrador_clientes (
    usuario_id uuid not null references usuarios_portal(id) on delete cascade,
    cliente_id uuid not null references clientes(id) on delete cascade,
    criado_em timestamptz not null default now(),
    primary key (usuario_id, cliente_id)
);

create table usuario_modulos (
    usuario_id uuid not null references usuarios_portal(id) on delete cascade,
    licenca_id uuid not null references licencas(id) on delete cascade,
    modulo_id uuid not null references modulos(id) on delete cascade,
    criado_em timestamptz not null default now(),
    primary key (usuario_id, licenca_id, modulo_id)
);

-- backfill: todo mundo mantém acesso a exatamente os módulos que já tinha
insert into usuario_modulos (usuario_id, licenca_id, modulo_id)
select ul.usuario_id, ul.licenca_id, lm.modulo_id
from usuario_licencas ul
join licenca_modulos lm on lm.licenca_id = ul.licenca_id
on conflict do nothing;
```

**API** (`UsuarioPortal`, novos campos): `papel: "master"|"administrador"|"usuario"`,
`escritorios_administrados: string[]` (ids de clientes, só relevante se
`papel == "administrador"`).

**Novo endpoint**: `PUT /licensing/usuarios/{id}/modulos` — payload
`{ licenca_id: UUID, modulo_ids: UUID[] }`, restrito a Master ou Administrador
do escritório dono da licença.

## Edge cases

- Administrador perde o vínculo em `administrador_clientes` com um escritório
  onde já havia promovido usuários a Administrador desse mesmo escritório —
  esses usuários promovidos MANTÊM o papel `administrador`, mas o vínculo em
  `administrador_clientes` deles não é afetado (cada vínculo é independente).
- Um usuário pode ter papel `administrador` sem nenhuma linha em
  `administrador_clientes` (Administrador "vazio", sem escritório atribuído)
  — trata-se como zero escopo, não como erro.
- CNPJ pertence a um cliente fora de `administrador_clientes` do Administrador
  que faz a request → 403, mesma mensagem padrão de `require_menu`.
- Licença cancelada/expirada: módulos concedidos em `usuario_modulos`
  continuam gravados no banco (não são apagados), mas `get_modulos_liberados`
  já filtra por `l.status = 'ativa'`, então não vazam acesso.

## Decisões tomadas

- Master = renomeação/formalização do `is_admin` atual (sem mudança de
  comportamento) — confirmado com o usuário.
- Administrador escopado a múltiplos escritórios via tabela N:N nova
  (`administrador_clientes`), não 1:1 — confirmado com o usuário.
- Licenças (contrato comercial) ficam somente-leitura para Administrador —
  confirmado.
- CNPJs: Administrador tem CRUD completo dentro do escopo — confirmado.
- papel e perfis_acesso COEXISTEM (não é substituição) — confirmado.
- Módulo é concedido POR USUÁRIO (`usuario_modulos`, tabela nova), não mais
  só por licença — confirmado. Alternativa rejeitada: manter módulo só a
  nível de licença (mais simples, mas não atende ao pedido de "usuário tem
  acesso ao que o administrador der acesso nos módulos").
- Administrador PODE promover outro usuário a Administrador (dentro do seu
  próprio escopo) — confirmado, ao contrário da recomendação inicial (que
  sugeria restringir a promoção só ao Master). Nenhum papel além do Master
  pode conceder papel `master`.

## Open questions / riscos

- Nenhuma pergunta bloqueante restante. Risco operacional: a coluna
  `is_admin` está referenciada em vários pontos do backend
  (`app/modules/licensing/menus.py`, `app/modules/admin/router.py`) — a
  migração precisa ser acompanhada de uma atualização coordenada de código
  (mesmo commit/deploy), já que removê-la sem atualizar o código quebra
  `get_menus_liberados` imediatamente.
