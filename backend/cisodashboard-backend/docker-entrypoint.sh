#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if pg_isready -h "$POSTGRES_SERVER" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Waiting for PostgreSQL... ($i/30)"
  sleep 2
done

echo "Running Alembic migrations..."
cd /app
# Stamp the current DB revision so alembic knows the schema is already applied,
# then try to run any pending migrations. If the migration fails because tables
# already exist (e.g. after a DB restore) we stamp head and continue.
alembic upgrade head 2>&1 || {
  echo "Migration warning: attempting to stamp current state and continue..."
  alembic stamp head --purge 2>/dev/null || alembic stamp head 2>/dev/null || echo "Stamp failed, continuing anyway"
}

echo "Starting Uvicorn application..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
