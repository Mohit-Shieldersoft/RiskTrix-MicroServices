#!/bin/bash
# Database initialization script

set -e

# Create extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable pg_stat_statements for query monitoring
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    
    -- Create indexes for performance
    -- These will be created by Alembic migrations, but keeping as backup
    
    -- Grant necessary permissions
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    
    -- Create multi-service isolated PostgreSQL schemas
    CREATE SCHEMA IF NOT EXISTS schema_identity;
    CREATE SCHEMA IF NOT EXISTS schema_app;
    CREATE SCHEMA IF NOT EXISTS schema_audit;
    CREATE SCHEMA IF NOT EXISTS schema_agent;
    CREATE SCHEMA IF NOT EXISTS schema_binary;
    CREATE SCHEMA IF NOT EXISTS schema_integrity;
    CREATE SCHEMA IF NOT EXISTS schema_threat;
    CREATE SCHEMA IF NOT EXISTS schema_cspm;
    CREATE SCHEMA IF NOT EXISTS schema_ciem;
    CREATE SCHEMA IF NOT EXISTS schema_k8s_container;
    CREATE SCHEMA IF NOT EXISTS schema_alerts;
    
    echo 'Database initialization completed successfully!';
EOSQL