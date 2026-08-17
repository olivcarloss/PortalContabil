# Templates de e-mail (convite e redefinição de senha)

O Supabase Auth dispara esses e-mails diretamente (não passa pelo backend), e não há
integração/API disponível nesta sessão para aplicar os templates automaticamente — precisam ser
colados manualmente no Dashboard.

## Como aplicar

1. Hospedar a logo (`frontend/public/ia-cloude-logo.png`) em uma URL pública (ex.: um bucket
   público do Supabase Storage, ou o domínio do site institucional). E-mails não carregam
   arquivos locais.
2. Abrir o arquivo do template (`convite-usuario.html` ou `redefinir-senha.html`), substituir
   `https://SUBSTITUA-PELA-URL-PUBLICA/ia-cloude-logo.png` pela URL real.
3. No Supabase Dashboard do projeto **Ia-cloude**: Authentication → Email Templates →
   **Invite user** (para `convite-usuario.html`) ou **Reset Password** (para
   `redefinir-senha.html`).
4. Colar o conteúdo do respectivo arquivo no campo de corpo do e-mail (HTML) e salvar.

## O que os templates já resolvem

- Nenhuma menção a "Supabase" no corpo do e-mail — o cliente só vê a marca IA-Cloude.
- Logo no topo, mensagem clara e botão de ação apontando para `{{ .ConfirmationURL }}`
  (variável do Supabase — não alterar).
- Link de fallback em texto simples, para quando o botão não renderiza no cliente de e-mail.

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
