---
name: deploy-hostinger
description: Deploy PortalContabil.cloud to the Hostinger VPS. Ensures GitHub is current with the local working tree (commits and pushes pending changes), then updates the VPS directly over SSH. Use when the user asks to deploy, publish, atualizar/subir para produção, sincronizar o VPS/Hostinger com o GitHub, or compilar/build no servidor.
---

# Deploy to Hostinger

Two stages, in order: sync GitHub with local, then update the VPS over SSH (direct access configured — see "Access" below).

## 1. Sync GitHub with local

1. `git status` at the repo root. If the tree is clean and local `main` is even with `origin/main`, skip straight to stage 2 and tell the user nothing needed pushing.
2. Otherwise, review what changed (`git diff`, `git status`) and stage the real source changes — never `.env`, build output, or anything gitignored. Match the existing commit message style (`git log --oneline -10`).
3. Commit, then `git push origin main`.
4. Confirm with `git status`: clean, "up to date with origin/main".

**Done when:** `origin/main` has everything the local tree has — no uncommitted diff, no unpushed commits.

## 2. Update the VPS

### Access

SSH alias `hostinger-deploy` (in `~/.ssh/config`) connects as the scoped `deploy` user via a dedicated passphrase-less key (`~/.ssh/id_ed25519_deploy` — separate from the human's own personal key on this machine, which has a passphrase and cannot be used non-interactively). `deploy` owns `/var/www/meuapp` and can run `git pull`, `pip install`, `npm ci/build` there directly. It can run exactly two things as root, passwordless, via `/etc/sudoers.d/deploy-meuapp`: `systemctl restart meuapp.service` and `systemctl status meuapp.service` (any flags). Nothing else — no other sudo, no access to the n8n/Traefik containers sharing the box.

If `ssh -o BatchMode=yes hostinger-deploy true` ever fails, don't fall back to guessing — the setup (user, key, sudoers rule) is fixed and known-good as of when this was written; a failure means something changed server-side. Report the exact SSH error to the human rather than attempting workarounds like `root@2.24.106.44` (that key has a passphrase and will hang or silently fail non-interactively).

### Fixed layout (not rediscoverable per run — cached from prior setup)

- Backend: `/var/www/meuapp/backend`, venv at `/var/www/meuapp/venv`, systemd service `meuapp.service`
- Frontend: `/var/www/meuapp/frontend`, built to `dist/`, served by nginx on `127.0.0.1:8081` behind Traefik — a fresh `npm run build` is picked up immediately, nginx needs no restart

### Steps

Before running, check whether this deploy needs anything beyond a plain pull-and-restart:
- **New/changed `.env` keys** — diff `backend/app/core/config.py` for new `settings.*` fields since the last deploy. `deploy` can read/edit `backend/.env` directly (it owns the tree) — add the key there via SSH before restarting the service.
- **New DB migrations** in `backend/app/db/migrations/` — these run against the shared Supabase database directly, not from the VPS (VPS and local backend point at the same `DATABASE_URL`). Apply any not yet run against production yourself first, from this machine — connect with the `DATABASE_URL` from local `backend/.env` and run the new `.sql` file(s) — same as done earlier in this project. Never run migrations through the VPS SSH session.

Then run, over the `hostinger-deploy` alias:

```bash
ssh hostinger-deploy '
  set -e
  cd /var/www/meuapp/backend && git pull origin main
  ../venv/bin/pip install -q -r requirements.txt
  sudo systemctl restart meuapp.service
  sudo systemctl status meuapp.service --no-pager | head -3
  cd /var/www/meuapp/frontend && npm ci --silent && npm run build
'
curl -sI https://portalcontabil.cloud | head -5
curl -s https://portalcontabil.cloud/api/admin/me -o /dev/null -w "%{http_code}\n"
```

**Done when:** both closing curls read `200` then `401` (401 is correct — the API refusing an unauthenticated request, proof it's live). A `git pull` conflict, a failed `pip install`/`npm run build`, or any non-200/401 result means stop and diagnose from the actual command output before retrying — never re-run blind.
