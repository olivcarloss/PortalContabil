# Template de e-mail de convite

O Supabase Auth dispara o e-mail de convite diretamente (não passa pelo backend), e não há
integração/API disponível nesta sessão para aplicar o template automaticamente — precisa ser
colado manualmente no Dashboard.

## Como aplicar

1. Hospedar a logo (`frontend/public/ia-cloude-logo.png`) em uma URL pública (ex.: um bucket
   público do Supabase Storage, ou o domínio do site institucional). E-mails não carregam
   arquivos locais.
2. Abrir `convite-usuario.html`, substituir `https://SUBSTITUA-PELA-URL-PUBLICA/ia-cloude-logo.png`
   pela URL real.
3. No Supabase Dashboard do projeto **Ia-cloude**: Authentication → Email Templates → **Invite user**.
4. Colar o conteúdo de `convite-usuario.html` no campo de corpo do e-mail (HTML) e salvar.

## O que o template já resolve

- Nenhuma menção a "Supabase" no corpo do e-mail — o cliente só vê a marca IA-Cloude.
- Logo no topo, mensagem de ativação clara e botão "Ativar minha conta" apontando para
  `{{ .ConfirmationURL }}` (variável do Supabase — não alterar).
- Link de fallback em texto simples, para quando o botão não renderiza no cliente de e-mail.

## Limitação atual: sem deploy público

O link de convite redireciona para `/aceitar-convite` usando a URL configurada em
`FRONTEND_ORIGIN` (hoje `http://localhost:5173`, no backend/.env). Isso significa que o convite
só funciona quando aberto na mesma máquina rodando o `npm run dev` do frontend. Para convites
funcionarem para qualquer destinatário remoto, é necessário publicar o frontend (Vercel, etc.) e
atualizar `FRONTEND_ORIGIN` para a URL pública.

## usando Git-Hub
Um projeto de contabilidade

### Install
$ pip install -r requirimentsgit.txt
