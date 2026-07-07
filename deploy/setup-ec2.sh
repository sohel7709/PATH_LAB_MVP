#!/usr/bin/env bash
# One-time provisioning script for a fresh Ubuntu 22.04 EC2 instance (t2.micro / t3.micro).
# Run as: bash setup-ec2.sh   (on the server, after SSH-ing in as `ubuntu`)
set -euo pipefail

echo "== Updating system packages =="
sudo apt-get update -y
sudo apt-get upgrade -y

echo "== Installing Node.js 20 LTS =="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "== Installing Nginx, git, build tools =="
sudo apt-get install -y nginx git build-essential

echo "== Installing PM2 (process manager) =="
sudo npm install -g pm2

echo "== Installing Chromium system libraries required by Puppeteer (PDF generation) =="
sudo apt-get install -y \
  libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxdamage1 \
  libxrandr2 libgbm1 libxkbcommon0 libasound2 libatk1.0-0 libcups2 \
  libpangocairo-1.0-0 fonts-liberation libappindicator3-1 xdg-utils

echo "== Creating 2GB swap file (t2/t3.micro only has 1GB RAM; Puppeteer/Sharp need headroom) =="
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "== Creating app directory =="
sudo mkdir -p /var/www/PATH_LAB_MVP
sudo chown -R "$USER":"$USER" /var/www/PATH_LAB_MVP

echo "== Done. Next steps =="
echo "1. git clone https://github.com/sohel7709/PATH_LAB_MVP /var/www/PATH_LAB_MVP"
echo "2. Create backend/.env from backend/.env.production.example"
echo "3. Run deploy/deploy.sh"
echo "4. Copy deploy/nginx.conf to /etc/nginx/sites-available/pathlab and enable it"
