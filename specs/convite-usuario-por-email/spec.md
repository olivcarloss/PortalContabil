# Spec: Convite de usuário por e-mail (sem UUID manual)

## Contexto e problema

Hoje, cadastrar um usuário no Portal de Licenciamento exige que o admin já
tenha criado manualmente uma conta em Authentication → Users no Supabase e
colado o UUID dela no formulário (`NovoUsuarioModal` em
`frontend/src/pages/licensing/UsuariosTab.tsx`, campo "ID do usuário
(Supabase Auth)"). Isso é operacionalmente inviável para o time de suporte e
propenso a erro (UUID errado vincula o acesso à pessoa errada). O objetivo é
o admin convidar alguém só com nome + e-mail + escritório + perfil, e o
backend criar a conta via Supabase Admin API, disparando o e-mail de
definição de senha — sem senha temporária visível a ninguém.

## Critérios de aceite (verificáveis)

- [ ] Admin preenche nome, e-mail, escritório e perfil de acesso num único
      formulário; não existe mais campo de UUID na UI.
- [ ] Ao salvar, o backend chama a Supabase Admin API
      (`POST /auth/v1/admin/users` com `email_confirm: false` e disparo de
      convite, usando `SUPABASE_SERVICE_ROLE_KEY`) para criar a conta em
      `auth.users`.
- [ ] O e-mail de convite chega ao destinatário e, ao concluir a definição de
      senha, a pessoa consegue logar no portal com o perfil e escritório
      corretos (login → `usuarios_portal` + `usuario_licencas` já vinculados).
- [ ] Se o e-mail informado já existe em `auth.users` (Admin API retorna
      erro de duplicidade), o backend NÃO tenta reenviar convite: reaproveita
      o `auth.users.id` existente e garante o vínculo em `usuarios_portal`
      (cria se não existir) + `usuario_licencas` para o escritório/perfil
      escolhidos (permite uma pessoa atender múltiplos escritórios com o
      mesmo e-mail).
- [ ] Se a chamada à Admin API falhar por qualquer outro motivo (rede fora do
      ar, e-mail malformado, rate limit), nenhuma linha é gravada em
      `usuarios_portal`/`usuario_licencas` e o admin vê a mensagem de erro
      retornada pela API para tentar novamente.
- [ ] A lista de usuários do portal mostra um badge "Convite pendente" para
      contas cujo `auth.users` ainda não teve a senha definida
      (`email_confirmed_at`/`last_sign_in_at` nulos via Admin API), e "Ativo"
      caso contrário.
- [ ] O formulário antigo (campo de UUID manual) é removido do código no
      mesmo deploy — não há período de convivência entre os dois fluxos.
- [ ] O endpoint de convite só pode ser chamado por usuário autenticado (mesma
      exigência de `get_current_user` já aplicada aos demais endpoints de
      `/licensing`).

## Fora de escopo

- Reenvio de um convite expirado ou não recebido.
- Cancelamento/revogação de um convite pendente.
- Edição do e-mail de um usuário já criado.
- Qualquer alteração ao mecanismo de RLS ou ao modelo de permissões por
  licença — este trabalho só troca a forma de *criação* da conta.

## Contratos de dados

### `POST /licensing/usuarios/convite` (novo endpoint, substitui `POST /licensing/usuarios`)

Request:
```json
{
  "nome": "Maria Souza",
  "email": "maria@escritorio.com.br",
  "cliente_id": "uuid-do-escritorio",
  "perfil_acesso_id": "uuid-do-perfil"
}
```

Response `201 Created` (convite novo) ou `200 OK` (conta reaproveitada):
```json
{
  "id": "uuid-do-usuario",
  "cliente_id": "uuid-do-escritorio",
  "nome": "Maria Souza",
  "cargo": null,
  "ativo": true,
  "convite_status": "enviado" | "conta_existente_reaproveitada",
  "criado_em": "...",
  "atualizado_em": "..."
}
```

Erros:
- `502 Bad Gateway` — Admin API do Supabase retornou erro não relacionado a
  duplicidade (mensagem original repassada em `detail`).
- `409 Conflict` — nunca deve ocorrer para e-mail duplicado (esse caso é
  tratado como sucesso via reaproveitamento); reservado para outras colisões
  eventuais.

Efeitos colaterais no Postgres (dentro da mesma transação lógica, só após a
chamada à Admin API ter sucesso):
1. `insert into usuarios_portal (id, cliente_id, nome, ativo) values (...)`
   — pulado se a linha já existir para aquele `id`.
2. Para cada licença ativa do `cliente_id` (mesma lógica hoje no frontend,
   movida para o backend): `insert into usuario_licencas (usuario_id,
   licenca_id, perfil_acesso_id) ...`, ignorando duplicatas já existentes.

### `GET /licensing/usuarios` (existente, resposta estendida)

Cada item ganha o campo `convite_status: "pendente" | "ativo"`, derivado de
uma consulta em lote à Admin API (`GET /auth/v1/admin/users`) para os IDs
retornados — `email_confirmed_at` nulo ⇒ `"pendente"`.

## Casos de borda mapeados

| Caso | Comportamento |
|---|---|
| E-mail já existe em `auth.users` | Reaproveita a conta; não reenvia convite; cria vínculo se faltante. Ver critério de aceite acima. |
| Admin API indisponível/erro genérico | Nada é gravado; erro exato é repassado ao admin. |
| Pessoa já vinculada àquele escritório+perfil | Idempotente — não duplica linha em `usuario_licencas`. |
| Escritório sem nenhuma licença ativa | Conta é criada normalmente; nenhuma linha em `usuario_licencas` (mesmo comportamento atual quando `perfilId` é vazio). |
| Perfil de acesso não enviado | Não permitido — perfil passa a ser obrigatório neste fluxo (o form antigo permitia "nenhum perfil"; este novo formulário sempre exige perfil, pois convite sem acesso não faz sentido operacional). |

## Decisões tomadas e alternativas rejeitadas

- **Admin convida por e-mail, sem senha temporária visível** — rejeitado:
  admin define senha manualmente (mais simples de implementar, mas exige um
  segundo canal fora de banda para entregar a senha, inseguro e sem convite
  por link).
- **E-mail duplicado reaproveita a conta existente** — rejeitado: bloquear
  com erro "e-mail já cadastrado" (mais simples, mas quebra o caso legítimo
  de uma pessoa atender vários escritórios com o mesmo e-mail).
- **Form antigo removido imediatamente, sem período de convivência** —
  rejeitado: manter os dois formulários como fallback temporário (mais
  seguro contra falhas do fluxo novo, mas adiciona código duplicado a
  remover depois; o time optou por simplicidade).
- **Critério de sucesso = fluxo feliz ponta a ponta (convite chega, login
  funciona)** — rejeitado: exigir também que todo erro tenha mensagem
  amigável específica (mais robusto, mas maior escopo de teste antes de
  fechar esta entrega — tratamento de erro genérico via `detail` da API já
  cobre o mínimo necessário).
- **Falha na Admin API aborta tudo (nada é criado)** — rejeitado: criar o
  vínculo mesmo com falha, marcando para retry manual (mais complexo e
  incompatível com "reenvio fora de escopo" já decidido).
- **Status pendente/ativo consultado em tempo real via Admin API** —
  alternativa de manter um campo local `convite_aceito_em` em
  `usuarios_portal`, atualizado por webhook do Supabase Auth, foi
  descartada por exigir configurar webhook (fora de escopo desta entrega);
  a consulta em lote à Admin API é suficiente para o volume atual de
  usuários.

## Riscos / questões em aberto

- A consulta em lote à Admin API para status de convite (`GET
  /auth/v1/admin/users`) não é paginada em massa hoje — se o número total de
  usuários da plataforma crescer muito, pode exigir paginação. Não é um
  risco relevante no volume atual.
- Nenhuma outra questão em aberto — critérios acima cobrem o fluxo completo
  sem "provavelmente"/"assumindo que".
