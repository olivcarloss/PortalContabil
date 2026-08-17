# Templates de e-mail (convite e redefinição de senha)

O Supabase Auth dispara esses e-mails diretamente (não passa pelo backend), e não há
integração/API disponível nesta sessão para aplicar os templates automaticamente — precisam ser
colados manualmente no Dashboard.

## Como aplicar

1. Exportar `frontend/public/portal-contabil-logo.svg` para PNG (suporte a SVG em e-mail é
   inconsistente, principalmente no Outlook) e hospedar em uma URL pública (ex.: um bucket
   público do Supabase Storage, ou o domínio do site institucional). E-mails não carregam
   arquivos locais.
2. Abrir o arquivo do template (`convite-usuario.html` ou `redefinir-senha.html`), substituir
   `https://SUBSTITUA-PELA-URL-PUBLICA/portal-contabil-logo.png` pela URL real.
3. No Supabase Dashboard do projeto **Ia-cloude**: Authentication → Email Templates →
   **Invite user** (para `convite-usuario.html`) ou **Reset Password** (para
   `redefinir-senha.html`).
4. Colar o conteúdo do respectivo arquivo no campo de corpo do e-mail (HTML) e salvar.
5. No mesmo formulário do template, preencher o campo **Subject** (separado do corpo HTML):
   - Invite user: `Convite de acesso — PortalContabil.cloud`
   - Reset Password: `Redefinição de senha — PortalContabil.cloud`

## O que os templates já resolvem

- Nenhuma menção a "Supabase" no corpo do e-mail — o cliente só vê a marca PortalContabil.cloud.
- Logo no topo, mensagem clara e botão de ação apontando para `{{ .ConfirmationURL }}`
  (variável do Supabase — não alterar).
- Link de fallback em texto simples, para quando o botão não renderiza no cliente de e-mail.

## Remetente do e-mail

O corpo e o assunto do e-mail não mencionam Supabase, mas por padrão o endereço do remetente
ainda é algo como `noreply@mail.app.supabase.io` — isso também aparece para o cliente (na caixa de
entrada, antes mesmo de abrir o e-mail). Para mascarar isso também, configure um SMTP próprio em
Authentication → Settings → SMTP Settings, com um remetente como
`nao-responda@portalcontabil.cloud` (requer um domínio de e-mail próprio configurado, fora do
escopo desta sessão).

## Limitação atual: sem deploy público

O link de convite redireciona para `/aceitar-convite`, e o de redefinição de senha para
`/redefinir-senha`, ambos usando a URL configurada em `FRONTEND_ORIGIN` (hoje
`http://localhost:5173`, no backend/.env). Isso significa que os dois só funcionam quando abertos
na mesma máquina rodando o `npm run dev` do frontend. Para funcionarem para qualquer destinatário
remoto, é necessário publicar o frontend (Vercel, etc.) e atualizar `FRONTEND_ORIGIN` para a URL
pública.

## usando Git-Hub
Um projeto de contabilidade

### Install
$ pip install -r requirimentsgit.txt
