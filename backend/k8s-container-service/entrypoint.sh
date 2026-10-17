#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready for k8s-container-service..."
until pg_isready -h "${POSTGRES_SERVER:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-risktrix_db}"; do
  echo "   PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready."

echo "🚀 Starting K8s Container Service on port 8016..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8016
