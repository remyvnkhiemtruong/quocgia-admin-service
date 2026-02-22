#!/bin/bash
# Run from admin-service dir: bash scripts/setup-db-from-zero.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
  ROOT="$SCRIPT_DIR/.."
else
  ROOT="$SCRIPT_DIR"
fi
cd "$ROOT"

echo "=== 1. Create .env if missing ==="
if [ ! -f .env ]; then
  printf 'PORT=5000\nNODE_ENV=production\nBASE_URL=https://gddpcamau.io.vn\nDB_HOST=postgres\nDB_PORT=5432\nDB_USER=heritage_user\nDB_PASSWORD=heritage_pass_123\nDB_NAME=heritage_db\n' > .env
  echo "Created .env"
else
  echo "Keeping existing .env"
fi

echo "=== 2. Stop and remove volumes ==="
docker compose down -v || true

echo "=== 3. Start stack ==="
docker compose up -d

echo "=== 4. Wait for Postgres ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker exec heritage_db pg_isready -U heritage_user -d heritage_db 2>/dev/null; then
    echo "Postgres ready."
    break
  fi
  echo "Waiting... ($i/10)"
  sleep 3
done

echo "=== 5. Run update.sql ==="
docker exec -i heritage_db psql -U heritage_user -d heritage_db < update.sql 2>/dev/null || true

echo "=== 6. Run init-info-tables.sql ==="
docker exec -i heritage_db psql -U heritage_user -d heritage_db < init-info-tables.sql 2>/dev/null || true

echo "=== 7. Run migrate-info-fields.sql ==="
docker exec -i heritage_db psql -U heritage_user -d heritage_db < migrate-info-fields.sql 2>/dev/null || true

echo "=== 8. Restart API ==="
docker compose up -d api

echo "=== Done. Test: curl -s http://127.0.0.1:5000/api/admin/heritages?page=1\&limit=5 ==="
