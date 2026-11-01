#!/bin/bash

# Starts the Marquee dev environment: Express proxy (port 3223) + Vite client (port 3001).
# Ctrl+C stops both.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
  echo "Missing server/.env (needs TMDB_API_KEY) — copy server/.env.example first." >&2
  exit 1
fi

cleanup() {
  echo ""
  echo "Stopping dev servers..."
  kill 0
}
trap cleanup EXIT INT TERM

echo "Starting server (http://localhost:3223)..."
(cd "$PROJECT_ROOT/server" && npm run dev) &

echo "Starting client (http://localhost:3001)..."
(cd "$PROJECT_ROOT/client" && npm run dev) &

wait
