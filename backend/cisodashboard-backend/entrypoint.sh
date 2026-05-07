#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${POSTGRES_SERVER:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-risktrix_db}"; do
  echo "   PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready."

echo "⏳ Checking migration state..."

# On a fresh DB (no alembic_version table), alembic current exits non-zero.
# Use || true so set -e does not abort the script.
CURRENT=$(python -m alembic current 2>&1) || true
echo "   alembic current: ${CURRENT:-<empty>}"

if echo "$CURRENT" | grep -qE "[a-f0-9]{8,}"; then
  echo "   Revision tracked — no stamp needed."
else
  # No revision tracked. Check whether app tables already exist
  # (DB was pre-populated by create_all or a prior partial run).
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
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users')\")
    print(cur.fetchone()[0])
    conn.close()
except Exception as e:
    print('False')
") || true

  if [ "$TABLE_EXISTS" = "True" ]; then
    echo "   Tables exist but no migration record — stamping database at head..."
    python -m alembic stamp head
    echo "   ✅ Stamped at head."
  else
    echo "   Fresh database — all migrations will run from scratch."
  fi
fi

echo "⏳ Running database migrations..."
python -m alembic upgrade head
echo "✅ Migrations complete."

echo "🚀 Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
