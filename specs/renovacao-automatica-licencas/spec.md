# Spec: Renovação automática de vigência das licenças

## Contexto e problema

Hoje uma `licenca` tem `data_inicio`/`data_fim`/`periodicidade`
(mensal/anual), mas nada acontece quando `data_fim` passa: a licença
simplesmente fica com a vigência vencida, sem renovar e sem sinalizar isso
em lugar nenhum. Isso não corresponde ao padrão de mercado de
licenciamento por assinatura, onde uma licença ativa se renova
automaticamente a cada ciclo até ser explicitamente suspensa/cancelada.
Esta entrega resolve especificamente esse gap: renovação automática da
vigência, sem tocar em planos/tiers, alertas de vencimento ou histórico de
faturamento (fora de escopo, ver abaixo).

## Critérios de aceite (verificáveis)

- [ ] Uma licença com `status = 'ativa'` e `data_fim` no passado tem sua
      `data_fim` estendida automaticamente na próxima vez que for lida por
      qualquer um dos pontos de leitura de licenças (ver Data contracts),
      sem ação manual do admin.
- [ ] A extensão avança em incrementos de 1 mês (`periodicidade = 'mensal'`)
      ou 1 ano (`periodicidade = 'anual'`), repetindo os incrementos até que
      `data_fim` seja hoje ou no futuro (cobre o caso de uma licença não lida
      por vários ciclos).
- [ ] `valor_unitario`, `valor_total`, `qtd_licencas`, módulos habilitados e
      todos os demais campos permanecem inalterados — só `data_fim` muda.
- [ ] Licenças com `status` `suspensa` ou `cancelada` NUNCA são renovadas
      automaticamente, mesmo com `data_fim` vencida.
- [ ] Licenças com `data_fim = null` (sem vencimento definido) são ignoradas
      pela renovação — não há nada a estender.
- [ ] Toda vez que uma licença é renovada automaticamente, o campo
      `ultima_renovacao_em` é atualizado com o timestamp da renovação.
- [ ] A tela de Ativações (Portal de Licenciamento → Produtos → Ativações
      por cliente) mostra, para cada licença com `ultima_renovacao_em`
      preenchido, um indicador "Renovada automaticamente em DD/MM/AAAA
      HH:MM".
- [ ] A renovação funciona sem exigir nenhuma infraestrutura de
      agendamento/cron nova — é acionada pela própria leitura via API.

## Fora de escopo

- Alertas de licença "a vencer" ou vencida (notificações, destaque
  proativo) — fica para uma entrega futura.
- Histórico de cobrança/faturas por período — fora de escopo; esta entrega
  só estende a vigência, não gera registros financeiros novos.
- Qualquer mudança em planos, tiers ou limites de uso por licença — não faz
  parte deste gap.
- Reativar ou renovar licenças `suspensa`/`cancelada` — comportamento
  explicitamente excluído (ver critérios de aceite).

## Contratos de dados

### Migração `0005_licencas_ultima_renovacao.sql`

```sql
alter table licencas add column if not exists ultima_renovacao_em timestamptz;
```

### Função de renovação (backend, `app/modules/licensing/renovacao.py`)

```python
def renovar_licencas_vencidas(conn) -> int:
    """UPDATE em lote: estende data_fim de toda licenca ativa vencida,
    em incrementos de periodicidade, até alcançar hoje. Retorna a
    quantidade de licenças renovadas."""
```

SQL (uma única `UPDATE ... RETURNING`, sem loop em Python):
```sql
update licencas
set
  data_fim = data_fim + (
    ceil(
      (current_date - data_fim)::numeric /
      case periodicidade when 'anual' then 365 else 30 end
    ) * case periodicidade when 'anual' then interval '1 year' else interval '1 month' end
  ),
  ultima_renovacao_em = now()
where status = 'ativa'
  and data_fim is not null
  and data_fim < current_date
returning id;
```

Chamada no início de cada endpoint de leitura de licenças:
- `GET /licensing/licencas` (e variantes filtradas)
- `GET /admin/overview` (One Page de Produtos)
- `app/modules/accounting/access.py` — `get_cnpjs_liberados` /
  `get_modulos_liberados` (Portal Contábil)

### `Licenca` (schema Pydantic)

Ganha `ultima_renovacao_em: datetime | None = None`.

## Casos de borda mapeados

| Caso | Comportamento |
|---|---|
| Licença ativa vencida há vários meses/anos, nunca lida nesse período | Estende em múltiplos incrementos de uma vez até `data_fim >= hoje` (cálculo via `ceil`, sem loop). |
| Licença `suspensa`/`cancelada` com `data_fim` vencida | Não renova — permanece vencida, como está hoje. |
| Licença com `data_fim = null` | Não renova — não há vigência definida a estender. |
| Duas requisições simultâneas leem/renovam a mesma licença | `UPDATE ... WHERE data_fim < current_date` é idempotente: a segunda requisição não encontra mais linhas vencidas para atualizar, sem duplicar a extensão. |
| Licença com `periodicidade` inválida | Não deve ocorrer — campo já validado por `CHECK` no banco e `pattern` no Pydantic; nenhum tratamento extra necessário. |

## Decisões tomadas e alternativas rejeitadas

- **Estende `data_fim` na mesma linha de `licencas`** — rejeitado: criar uma
  nova licença por período (mais próximo de "uma fatura por ciclo", mas
  exigiria recriar módulos/vínculos de usuário a cada renovação; fora do
  gap identificado).
- **Verificação preguiçosa a cada leitura, sem cron** — rejeitado: job
  agendado diário (mais previsível, mas exige infraestrutura de
  agendamento que o projeto não tem hoje; a leitura preguiçosa cobre o
  mesmo resultado sem essa dependência).
- **Só licenças `ativa` renovam** — rejeitado: renovar qualquer status
  vencido (reativaria licenças canceladas/suspensas de propósito pelo
  admin, o que é um bug, não uma feature).
- **Registra `ultima_renovacao_em` e mostra na UI** — rejeitado: renovação
  totalmente silenciosa (mais simples, mas o admin perderia
  rastreabilidade de quando uma vigência foi estendida automaticamente
  versus editada manualmente).
- **UPDATE em lote via SQL (`ceil` + intervalo), sem loop em Python** —
  escolhido por ser uma única operação atômica e idempotente; um loop em
  Python exigiria ler, calcular e re-escrever linha a linha, sem ganho real
  (YAGNI).

## Riscos / questões em aberto

Nenhuma questão em aberto — os critérios acima cobrem o comportamento
completo sem "provavelmente"/"assumindo que". Risco aceito: como a
renovação só dispara na leitura, uma licença vencida que nunca é
consultada por ninguém (nenhum admin abre a tela, nenhum usuário do
escritório acessa o Portal Contábil) fica com `data_fim` vencida
indefinidamente até a primeira leitura — comportamento esperado dado a
decisão de não usar cron.
