# AWS Free-Tier Deployment Runbook — LabNexus (PATH_LAB_MVP)

A single EC2 instance running Nginx + PM2, serving the React build and proxying the
Express API. MongoDB stays on the existing Atlas cluster. HTTP-only on the EC2 IP
first; `labnexus.in` gets wired in later once DNS is ready (see §12).

**Estimated cost:** $0/month for the first 12 months, as long as you stay inside the
limits in §13.

---

## 1. Architecture

```
 Browser
    |
    v
 EC2 (t2.micro / t3.micro)
    |-- Nginx :80
    |     |-- /            -> frontend/dist (static React build)
    |     |-- /api, /uploads -> proxy_pass -> Node :5001 (PM2-managed)
    |
    v
 MongoDB Atlas (external, already in use)
```

One instance to patch, one place to SSH into, one bill line — no S3/CloudFront split.
Since the frontend and API share an origin behind Nginx, there's no CORS to configure
in production. Puppeteer (used for PDF report generation) runs on the same box once
given swap headroom, which the setup script configures.

---

## 2. Before you start

- An AWS account (free tier applies for 12 months from account creation).
- A local SSH key pair, or create one during instance launch.
- Your MongoDB Atlas connection string, and a **fresh** `JWT_SECRET` for production
  (don't reuse a dev secret).
- The GitHub repo `sohel7709/PATH_LAB_MVP` pushed with the deploy files listed in §15.

> **Why HTTP-only first:** `labnexus.in` isn't pointed at anything yet. Getting the
> app running on the bare EC2 IP first lets you verify the whole stack before
> touching DNS — then §12 layers HTTPS on top without re-deploying the app.

---

## 3. AWS account & billing alarm

1. Sign up / sign in to the AWS Console.
2. **Set a billing alarm before creating anything else.** Go to
   *Billing and Cost Management → Budgets → Create budget*, choose a zero-based
   monthly cost budget, set a threshold like $1, and add your email as an alert
   recipient. This is the best insurance against a surprise bill.
3. **Pick your region** (e.g. `ap-south-1` Mumbai for an India-based lab app) and use
   it consistently for every resource below.

---

## 4. Launch the EC2 instance

1. Open **EC2 → Launch instance**.
2. **Name:** `pathlab-prod`.
3. **AMI:** Ubuntu Server 22.04 LTS (free tier eligible).
4. **Instance type:** `t2.micro` (or `t3.micro` if your account's free tier offer
   includes it — the console marks whichever is eligible).
5. **Key pair:** create a new one, download the `.pem`, and `chmod 400` it locally.
   You cannot re-download it later.
6. **Network settings → Security group:** create `pathlab-sg` with these inbound
   rules:

   | Type  | Port | Source                         |
   |-------|------|---------------------------------|
   | SSH   | 22   | My IP (**not** `0.0.0.0/0`)     |
   | HTTP  | 80   | Anywhere (`0.0.0.0/0`)          |
   | HTTPS | 443  | Anywhere — add now, use in §12  |

   > Leaving port 22 open to `0.0.0.0/0` is the most common way EC2 boxes get
   > compromised within hours. Restrict it to "My IP" and update it if your IP
   > changes.

7. **Storage:** 20–30GB gp3 (inside the 30GB free-tier EBS allowance).
8. **Launch instance.**

---

## 5. Attach an Elastic IP

Without this, your public IP changes every time the instance stops/starts.

1. **EC2 → Network & Security → Elastic IPs → Allocate Elastic IP address.**
2. **Actions → Associate Elastic IP address** → select `pathlab-prod`.

> **Free-tier nuance:** an Elastic IP is free *while attached to a running
> instance*. If you stop the instance and leave the IP allocated but unattached,
> AWS bills a small hourly rate for it.

---

## 6. Provision the server

SSH in and run the one-time setup script — it installs Node 20, Nginx, PM2, the
system libraries Puppeteer needs for PDF generation, and a 2GB swap file (the micro
instances only have 1GB RAM).

```bash
# from your local machine
ssh -i /path/to/your-key.pem ubuntu@<ELASTIC_IP>

# on the server
git clone https://github.com/sohel7709/PATH_LAB_MVP /var/www/PATH_LAB_MVP
cd /var/www/PATH_LAB_MVP
bash deploy/setup-ec2.sh
```

---

## 7. Configure the app

1. **Backend environment:**

   ```bash
   cd /var/www/PATH_LAB_MVP/backend
   cp .env.production.example .env
   nano .env
   ```

   Set `MONGODB_URI` (Atlas connection string), a freshly generated `JWT_SECRET`
   (`openssl rand -base64 48`), and leave `PORT=5001`.

2. **Frontend environment:** already committed as `frontend/.env.production` with
   `VITE_API_BASE_URL=/api` — this makes the built app call the API on the same
   origin Nginx serves, so no CORS configuration is needed in production.

---

## 8. First deploy

```bash
cd /var/www/PATH_LAB_MVP
bash deploy/deploy.sh
```

This installs backend/frontend dependencies, builds the React app into
`frontend/dist`, starts the API under PM2 using `backend/ecosystem.config.js`, and
reloads Nginx. Then lock PM2's process list so it survives a reboot:

```bash
pm2 startup systemd
# PM2 prints a sudo command — copy/paste and run exactly what it outputs
pm2 save
```

---

## 9. Wire up Nginx

```bash
sudo cp /var/www/PATH_LAB_MVP/deploy/nginx.conf /etc/nginx/sites-available/pathlab
sudo ln -s /etc/nginx/sites-available/pathlab /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. Verify it's live

1. **API health check:** `curl http://<ELASTIC_IP>/health` should return
   `{"success":true,...}`.
2. **Frontend:** open `http://<ELASTIC_IP>` in a browser — the LabNexus login screen
   should load.
3. **End-to-end:** log in and generate one PDF report — this step is the most likely
   to expose a missing Puppeteer/Chromium dependency. See §14 if it fails.

---

## 11. Future redeploys

Push to `master` locally. A GitHub Actions workflow (`.github/workflows/deploy.yml`)
SSHes into the server and runs `deploy/deploy.sh` automatically on every push. To
redeploy manually instead:

```bash
cd /home/ubuntu/apps/PATH_LAB_MVP && bash deploy/deploy.sh
```

That's a git pull, dependency install, frontend rebuild, and a zero-downtime PM2
reload in one command.

---

## 12. Later: attaching labnexus.in + HTTPS

Do this once your registrar's DNS is ready to point at AWS. No app code changes are
needed — only Nginx and DNS.

1. **DNS:** at your domain registrar, create an `A` record for `labnexus.in` and
   `www.labnexus.in` pointing at your Elastic IP. Propagation can take a few hours.
2. **Update Nginx:** edit `/etc/nginx/sites-available/pathlab`, change
   `server_name _;` to `server_name labnexus.in www.labnexus.in;`, then
   `sudo nginx -t && sudo systemctl reload nginx`.
3. **Issue a free TLS certificate:**

   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d labnexus.in -d www.labnexus.in
   ```

   Certbot edits the Nginx config to add the 443 server block, redirects HTTP →
   HTTPS, and installs a renewal timer automatically.

4. **Confirm auto-renewal:** `sudo certbot renew --dry-run`.

---

## 13. Staying inside free tier

| Resource            | Free allowance                          | Watch out for |
|----------------------|------------------------------------------|----------------|
| EC2 (t2/t3.micro)    | 750 instance-hours/mo for 12 months       | One instance 24/7 uses ~730 hrs — fine. A second concurrent test instance can tip you over. |
| EBS storage          | 30GB                                      | Keep the root volume at 20–30GB; don't attach extra volumes. |
| Elastic IP           | Free while attached to a running instance | Billed hourly if allocated but unattached, or attached to a stopped instance. |
| Data transfer out    | 100GB/mo (always-free tier)               | Unlikely to matter for a lab-management app's traffic. |
| MongoDB Atlas        | M0 cluster, separate from AWS billing     | Already in use — not part of the AWS free-tier clock at all. |

Check *Billing → Free Tier* in the console periodically — it shows live usage
against each allowance, not just the alarm you set in §3.

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 502 Bad Gateway | Node process isn't running | `pm2 status`, then `pm2 logs pathlab-backend` |
| PDF generation fails / Chromium crash | Missing system libs or OOM on 1GB RAM | Re-run the lib install block in `setup-ec2.sh`; confirm swap with `free -h` |
| Blank page, JS 404s | Frontend not rebuilt after a pull | Re-run `deploy/deploy.sh` — it always rebuilds `dist` |
| MongoDB connection error | Atlas IP allowlist doesn't include the EC2 IP | Atlas → Network Access → add the Elastic IP |
| Login works locally, fails on server | Stale `JWT_SECRET` mismatch after redeploy | Don't rotate `JWT_SECRET` on redeploy — it's read once from `.env`, unaffected by `git pull` |
| Instance runs out of memory | Puppeteer + Node under load on 1GB RAM | Confirm swap is active; `ecosystem.config.js` already sets `max_memory_restart` |

---

## 15. Files added to the repo

These are deployment-ready and committed alongside this guide — nothing here needs
to exist only on the server.

| File | Purpose |
|---|---|
| `backend/ecosystem.config.js` | PM2 process definition — memory guard, log paths, production env. |
| `backend/.env.production.example` | Template for the real `.env` you create on the server (never commit the filled-in version). |
| `frontend/.env.production` | Points the built frontend at `/api` (same-origin), sidestepping CORS entirely in production. |
| `deploy/setup-ec2.sh` | One-time server provisioning: Node, Nginx, PM2, Puppeteer libs, swap file. |
| `deploy/deploy.sh` | Repeatable redeploy: pull, install, build, PM2 reload, Nginx reload. |
| `deploy/nginx.conf` | Reverse proxy + static SPA config, ready to drop into `sites-available`. |
