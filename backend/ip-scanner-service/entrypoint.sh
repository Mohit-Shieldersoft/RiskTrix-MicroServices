#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready for ip-scanner-service..."
until pg_isready -h "${POSTGRES_SERVER:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-risktrix_db}"; do
  sleep 2
done

echo "Starting IP Scanner Service on port 8018..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8018
