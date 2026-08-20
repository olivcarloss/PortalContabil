---
name: deploy-hostinger
description: Deploy PortalContabil.cloud to the Hostinger VPS. Ensures GitHub is current with the local working tree (commits and pushes pending changes), then hands the human the VPS-side update block. Use when the user asks to deploy, publish, atualizar/subir para produção, sincronizar o VPS/Hostinger com o GitHub, or compilar/build no servidor.
---

# Deploy to Hostinger

Two stages, in order: sync GitHub with local, then update the VPS. Claude has no SSH access to the VPS (tested and confirmed refused) — stage 2 always ends in a command block for the human to run, never an attempted connection.

## 1. Sync GitHub with local

1. `git status` at the repo root. If the tree is clean and local `main` is even with `origin/main`, skip straight to stage 2 and tell the user nothing needed pushing.
2. Otherwise, review what changed (`git diff`, `git status`) and stage the real source changes — never `.env`, build output, or anything gitignored. Match the existing commit message style (`git log --oneline -10`).
3. Commit, then `git push origin main`.
4. Confirm with `git status`: clean, "up to date with origin/main".

**Done when:** `origin/main` has everything the local tree has — no uncommitted diff, no unpushed commits.

## 2. Update the VPS

Fixed VPS layout (not rediscoverable per run — cached here from prior setup):
- Backend: `/var/www/meuapp/backend`, venv at `/var/www/meuapp/venv`, systemd service `meuapp.service`
- Frontend: `/var/www/meuapp/frontend`, built to `dist/`, served by nginx on `127.0.0.1:8081` behind Traefik — `npm run build` alone is enough, nginx needs no restart
- SSH target: `root@2.24.106.44`

Before printing the block, check whether this deploy needs anything beyond a plain pull-and-restart, and fold it in:
- **New/changed `.env` keys** — diff `backend/app/core/config.py` for new `settings.*` fields since the last deploy; add the matching `.env` line(s) to the block.
- **New DB migrations** in `backend/app/db/migrations/` — these run against the shared Supabase database directly, not from the VPS (VPS and local backend point at the same `DATABASE_URL`). Apply any not yet run against production yourself first — connect with the `DATABASE_URL` from `backend/.env` and run the new `.sql` file(s), the same way already done earlier in this project — then leave migrations out of the VPS block entirely.

Then print this block (adjusted for anything found above) for the human to paste into an SSH session:

```bash
cd /var/www/meuapp/backend
git pull origin main
source ../venv/bin/activate
pip install -r requirements.txt
systemctl restart meuapp.service
systemctl status meuapp.service --no-pager

cd /var/www/meuapp/frontend
npm ci
npm run build

curl -sI https://portalcontabil.cloud | head -5
curl -s https://portalcontabil.cloud/api/admin/me -o /dev/null -w "%{http_code}\n"
```

**Done when:** the human reports back, and the two closing curls read `200` then `401` (401 is correct — it's the API refusing an unauthenticated request, proof it's live). A `git pull` conflict or any non-200/401 result means stop and diagnose from the pasted output before suggesting another run.
