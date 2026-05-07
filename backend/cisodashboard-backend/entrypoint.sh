#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${POSTGRES_SERVER:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-risktrix_db}"; do
  echo "   PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready."

echo "⏳ Checking migration state..."

# Check if alembic_version table already tracks a revision (hex hash in output)
CURRENT=$(python -m alembic current 2>&1)

if echo "$CURRENT" | grep -qE "[a-f0-9]{8,}"; then
  echo "   Migration history found: $(echo "$CURRENT" | grep -oE '[a-f0-9]{8,}' | head -1)"
else
  # No revision tracked yet. Check if app tables already exist (e.g. from a prior run).
  TABLE_EXISTS=$(python -c "
import psycopg2, os, sys
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
")
  if [ "$TABLE_EXISTS" = "True" ]; then
    echo "   Tables already exist but no migration record — stamping database at head..."
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
