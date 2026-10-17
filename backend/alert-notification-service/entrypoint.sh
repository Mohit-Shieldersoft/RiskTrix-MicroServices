#!/bin/sh
set -e

echo "Starting Alert & Notification Service on port 8017..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8017
