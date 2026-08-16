# Portal IA-Cloude

Portal web (Licenciamento + Contábil) integrado ao projeto Supabase **Ia-cloude**.

- **Backend**: FastAPI (`backend/`), conecta direto no Postgres do Supabase.
- **Frontend**: React + Vite + TypeScript (`frontend/`), autenticação via Supabase Auth.
- **Identidade visual**: extraída de `ia-cloude.com/wb` (cores em `frontend/src/theme`).

## O que já está pronto

- Schema de licenciamento criado e aplicado no banco (`backend/app/db/migrations/0001_licensing_schema.sql`):
  produtos, módulos, perfis de acesso, licenças, vínculo de usuários a licenças — com RLS.
- Catálogo padrão de mercado (10 produtos, 22 módulos, 4 perfis) já semeado no banco
  (`backend/app/db/seed/seed_produtos_padrao.sql`).
- API FastAPI com endpoints de licenciamento (`/api/licensing/...`) e do Portal Contábil
  (`/api/accounting/...`), este último filtrando os dados de `conciliacoes`/`lancamentos`
  pelas licenças ativas do usuário autenticado.
- Frontend React com tela de login, Portal de Licenciamento e Portal Contábil, já com o
  tema visual do site de referência.
- Build de produção do frontend e o backend testados localmente com sucesso.

## Pendências para rodar de ponta a ponta

Faltam 3 valores do painel do Supabase (**Project Settings → API**, projeto `knhyixsjidjsfytgqnjn`)
que ainda não foram fornecidos:

1. `SUPABASE_ANON_KEY` → `backend/.env` e `frontend/.env` (`VITE_SUPABASE_ANON_KEY`)
2. `SUPABASE_SERVICE_ROLE_KEY` → `backend/.env` (uso futuro, ex. criação de usuários via admin API)
3. `SUPABASE_JWT_SECRET` (**Project Settings → API → JWT Settings**) → `backend/.env`,
   necessário para o backend validar o token de login dos usuários

Sem o `SUPABASE_JWT_SECRET`, o backend sobe normalmente mas todo endpoint autenticado
retorna 401/500 (o teste feito confirmou isso: `/api/health` funciona, `/api/licensing/produtos`
sem token retorna 401 corretamente).

Também é necessário criar ao menos um usuário no Supabase Auth (Authentication → Users) e
vinculá-lo a um `cliente_id` na tabela `usuarios_portal` para poder logar e ver dados no
Portal Contábil.

## Como rodar localmente

### Backend
```bash
cd backend
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt
# preencher backend/.env com as chaves do Supabase
./.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```
Docs interativas: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
# preencher frontend/.env com VITE_SUPABASE_ANON_KEY
npm run dev
```
App: http://localhost:5173

## Próximos passos sugeridos

- Preencher as chaves do Supabase pendentes.
- Criar o primeiro usuário admin (Supabase Auth) + registro em `usuarios_portal` + `usuario_licencas`
  com perfil `ADMIN_ESCRITORIO`.
- Formulários de criação (produto/cliente/CNPJ/licença) no Portal de Licenciamento — hoje a
  tela lista os dados via API; os endpoints `POST` já existem no backend, falta a UI de criação.
- Policies de escrita (INSERT/UPDATE) no RLS, caso o acesso direto via PostgREST/Supabase
  client passe a ser usado no lugar do backend para essas tabelas (hoje as escritas passam
  pelo backend usando a connection string, que tem acesso total).
