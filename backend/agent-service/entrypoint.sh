#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${POSTGRES_SERVER:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-risktrix_db}"; do
  echo "   PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready."

echo "⏳ Checking migration state..."

# On a fresh DB alembic current exits non-zero — use || true so set -e does not abort.
CURRENT=$(python -m alembic current 2>&1) || true
echo "   alembic current: ${CURRENT:-<empty>}"

if echo "$CURRENT" | grep -qE "[a-f0-9]{8,}"; then
  echo "   Revision tracked — no stamp needed."
else
  # No revision tracked. Check whether agents table already exists
  # (DB pre-populated by a prior partial run).
  TABLE_EXISTS=$(python -c "
import psycopg2, os
try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_SERVER','postgres'),
        user=os.environ.get('POSTGRES_USER','postgres'),
        password=os.environ.get('POSTGRES_PASSWORD','password'),
        dbname=os.environ.get('POSTGRES_DB','risktrix_db')
    )
    cur = conn.cursor()
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agents')\")
    print(cur.fetchone()[0])
    conn.close()
except Exception as e:
    print('False')
") || true

  if [ "$TABLE_EXISTS" = "True" ]; then
    echo "   agents table exists but no revision tracked — stamping head."
    python -m alembic stamp head || true
  else
    echo "   Fresh DB — running migrations from scratch."
  fi
fi

echo "⏳ Running database migrations..."
python -m alembic upgrade head
echo "✅ Migrations complete."

echo "🚀 Starting agent service..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8010
