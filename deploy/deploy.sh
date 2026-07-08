#!/usr/bin/env bash
# Redeploy script — run from the repo root on the EC2 server after `git pull`.
# Usage: bash deploy/deploy.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "== Pulling latest code =="
git pull origin master

echo "== Installing backend dependencies =="
cd "$REPO_ROOT/backend"
npm ci --omit=dev

echo "== Installing frontend dependencies and building =="
cd "$REPO_ROOT/frontend"
npm ci
npm run build

echo "== Restarting backend with PM2 =="
cd "$REPO_ROOT/backend"
pm2 startOrReload ecosystem.config.js --env production
pm2 save

echo "== Reloading Nginx (in case config changed) =="
sudo nginx -t && sudo systemctl reload nginx

echo "== Deploy complete =="
pm2 status
