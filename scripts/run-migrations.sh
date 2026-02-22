#!/bin/bash
# Chạy toàn bộ migration cho economics, geography, literature, fineart.
# Trên server (Docker): ./scripts/run-migrations.sh
# Hoặc: bash scripts/run-migrations.sh

set -e
cd "$(dirname "$0")/.."

if docker ps --format '{{.Names}}' | grep -q '^heritage_db$'; then
  echo "Using Docker container heritage_db..."
  for f in init-info-tables.sql migrate-info-fields.sql; do
    if [ -f "$f" ]; then
      echo "Running $f..."
      cat "$f" | docker exec -i heritage_db psql -U "${DB_USER:-heritage_user}" -d "${DB_NAME:-heritage_db}" 2>/dev/null || true
      echo "Done $f"
    fi
  done
  echo "Migrations finished."
else
  echo "heritage_db container not running. Run with psql directly:"
  echo "  psql -U heritage_user -d heritage_db -f init-info-tables.sql"
  echo "  psql -U heritage_user -d heritage_db -f migrate-info-fields.sql"
  exit 1
fi
