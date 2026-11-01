#!/bin/bash

# Exit immediately if any command fails
set -e

PROJECT_ROOT=$(pwd)
CLIENT_TARGET="/var/www/marquee"
SERVER_TARGET="/var/www/marquee/server"

echo "🚀 Starting local deployment for Marquee..."

# 1. Pull latest source
echo "Checking git status..."
git checkout master
git pull origin master

# 2. Install dependencies
echo "📦 Installing client and server dependencies..."
cd "$PROJECT_ROOT"/client && npm ci
cd "$PROJECT_ROOT"/server && npm ci

# 3. Build
echo "🏗️ Building client production assets..."
cd "$PROJECT_ROOT"/client && rm -rf dist && npm run build

echo "🏗️ Building server production assets..."
cd "$PROJECT_ROOT"/server && rm -rf dist && npm run build

# 4. Deploy client (flat static files, same as before)
echo "🚚 Syncing client build to $CLIENT_TARGET..."
sudo mkdir -p "$CLIENT_TARGET"
sudo find "$CLIENT_TARGET" -maxdepth 1 -mindepth 1 -not -name server -exec rm -rf {} +
sudo cp -r "$PROJECT_ROOT"/client/dist/* "$CLIENT_TARGET"/

# 5. Deploy server
echo "🚚 Syncing server build to $SERVER_TARGET..."
sudo mkdir -p "$SERVER_TARGET"
sudo rm -rf "$SERVER_TARGET"/dist
sudo cp -r "$PROJECT_ROOT"/server/dist "$SERVER_TARGET"/dist
sudo cp "$PROJECT_ROOT"/server/package*.json "$SERVER_TARGET"/

# IMPORTANT: server/.env holds TMDB_API_KEY and is NOT in git.
# Deploy it once manually to $SERVER_TARGET/.env and this script will
# leave it alone (it's not touched by the rm -rf above).
if [ ! -f "$SERVER_TARGET/.env" ]; then
  echo "⚠️  WARNING: $SERVER_TARGET/.env not found. Server will fail to start without TMDB_API_KEY."
  echo "    Create it manually: sudo nano $SERVER_TARGET/.env"
fi

echo "⚙️ Installing server production dependencies..."
cd "$SERVER_TARGET"
sudo npm install --production

# 6. Restart services
echo "🔄 Restarting application services..."
pm2 startOrRestart "$PROJECT_ROOT"/ecosystem.config.js
sudo systemctl restart nginx

echo "✅ Deployment complete! Your app is live at https://marquee.mrspinn.ca"
