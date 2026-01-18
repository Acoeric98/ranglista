#!/usr/bin/env bash
# One-button deploy:
# - Ensures SSH auth to GitHub (loads key if needed)
# - Clones repo into /var/www/html/wormapp if missing, else hard-syncs to origin/<branch>
# - Installs deps, builds production bundle
# - Publishes dist/ and serves it via Nginx on port 1331

set -euo pipefail

# ---------- Config (override via env if needed) ----------
REPO_SSH="${REPO_SSH:-git@github.com:Acoeric98/worm-palace.git}"
APP_DIR="${APP_DIR:-/var/www/html/wormapp}"
SITE_NAME="${SITE_NAME:-wormapp}"
PORT="${PORT:-1331}"
BRANCH="${BRANCH:-}"   # if empty, autodetect remote default
# --------------------------------------------------------

echo "[0/7] Detect default branch (if not provided)"
if [ -z "$BRANCH" ]; then
  # Parse remote HEAD safely -> get just the branch name (e.g., 'main' or 'master')
  DEFAULT_REF="$(git ls-remote --symref "$REPO_SSH" HEAD 2>/dev/null | awk '/^ref:/ {gsub("refs/heads/","",$2); print $2}')"
  BRANCH="${DEFAULT_REF:-main}"
fi
echo "      -> Using branch: ${BRANCH}"

WEBROOT="${APP_DIR}/dist"

echo "[1/7] Ensure base packages (git, nginx, rsync, curl, node)"
sudo apt update -y
sudo apt install -y git nginx rsync curl
if ! command -v node >/dev/null 2>&1; then
  echo "  -> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

echo "[2/7] Ensure SSH auth to GitHub"
# If SSH auth might need the key (passphrase), try to load it silently
if ! ssh -o BatchMode=yes -T git@github.com 2>/dev/null; then
  eval "$(ssh-agent -s)" >/dev/null
  ssh-add ~/.ssh/github_ed25519 || true
fi

echo "[3/7] Fetch source into ${APP_DIR} (branch: ${BRANCH})"
sudo mkdir -p "$(dirname "${APP_DIR}")"
sudo chown -R "$USER":"$USER" "$(dirname "${APP_DIR}")"

if [ ! -d "${APP_DIR}/.git" ]; then
  # If directory exists and not empty, back it up first
  if [ -d "${APP_DIR}" ] && [ "$(ls -A "${APP_DIR}" 2>/dev/null || true)" ]; then
    mv "${APP_DIR}" "${APP_DIR}.bak.$(date +%F_%H%M%S)"
    echo "  -> Backed up existing folder to: ${APP_DIR}.bak.*"
  fi
  # Shallow clone the target branch
  git clone --branch "${BRANCH}" --depth 1 "${REPO_SSH}" "${APP_DIR}"
else
  cd "${APP_DIR}"
  # Ensure origin points to SSH URL
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "${REPO_SSH}"
  else
    git remote add origin "${REPO_SSH}"
  fi
  git fetch --prune origin
  # Checkout target branch, then hard reset to remote state (deploy box style)
  git checkout -B "${BRANCH}" || true
  git reset --hard "origin/${BRANCH}"
fi

echo "[4/7] Install dependencies"
cd "${APP_DIR}"
if [ -f package-lock.json ]; then
  npm ci --no-audit
else
  npm install --no-audit
fi

echo "[5/7] Build production bundle"
npm run build

echo "[6/7] Publish dist/ to webroot and set permissions"
sudo mkdir -p "${WEBROOT}"
sudo rsync -a --delete --delay-updates "${APP_DIR}/dist/" "${WEBROOT}/"
sudo chown -R www-data:www-data "${WEBROOT}"

echo "[7/7] Ensure Nginx site on port ${PORT}"
sudo tee /etc/nginx/sites-available/${SITE_NAME} >/dev/null <<EOF
server {
    listen ${PORT};
    server_name _;
    root ${WEBROOT};
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files \$uri =404;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${SITE_NAME} /etc/nginx/sites-enabled/${SITE_NAME}
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
if command -v ufw >/dev/null 2>&1; then sudo ufw allow ${PORT}/tcp || true; fi

IP="$(hostname -I | awk '{print $1}')"
echo "Deploy done. Open: http://${IP}:${PORT}/"
