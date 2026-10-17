-- RiskTrix PostgreSQL Multi-Schema Isolation DDL
-- Phase 2.1: Create isolated PostgreSQL schemas for all platform microservices

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 1. Identity & Auth Schema (cisodashboard-backend monolith)
CREATE SCHEMA IF NOT EXISTS schema_identity;

-- 2. Application Security Service Schema (application-service:8001)
CREATE SCHEMA IF NOT EXISTS schema_app;

-- 3. Audit & Compliance Service Schema (audit-service:8002)
CREATE SCHEMA IF NOT EXISTS schema_audit;

-- 4. Endpoint Agent Service Schema (agent-service:8010)
CREATE SCHEMA IF NOT EXISTS schema_agent;

-- 5. Binary Analysis Service Schema (binary-analysis-service:8011)
CREATE SCHEMA IF NOT EXISTS schema_binary;

-- 6. Integrity Verification Service Schema (integrity-service:8012)
CREATE SCHEMA IF NOT EXISTS schema_integrity;

-- 7. Threat Intelligence Service Schema (threat-intelligence-service:8013)
CREATE SCHEMA IF NOT EXISTS schema_threat;

-- 8. Cloud Security Posture Management Schema (cspm-service:8014)
CREATE SCHEMA IF NOT EXISTS schema_cspm;

-- 9. Cloud Infrastructure Entitlement Management Schema (ciem-service:8015)
CREATE SCHEMA IF NOT EXISTS schema_ciem;

-- 10. Kubernetes & Container Security Schema (k8s-container-service:8016)
CREATE SCHEMA IF NOT EXISTS schema_k8s_container;

-- 11. Security Alerts & Notification Service Schema (alert-notification-service:8017)
CREATE SCHEMA IF NOT EXISTS schema_alerts;

CREATE SCHEMA IF NOT EXISTS schema_ip_scanner;

-- Grant permissions on schemas to postgres user
GRANT ALL ON SCHEMA schema_identity TO postgres;
GRANT ALL ON SCHEMA schema_app TO postgres;
GRANT ALL ON SCHEMA schema_audit TO postgres;
GRANT ALL ON SCHEMA schema_agent TO postgres;
GRANT ALL ON SCHEMA schema_binary TO postgres;
GRANT ALL ON SCHEMA schema_integrity TO postgres;
GRANT ALL ON SCHEMA schema_threat TO postgres;
GRANT ALL ON SCHEMA schema_cspm TO postgres;
GRANT ALL ON SCHEMA schema_ciem TO postgres;
GRANT ALL ON SCHEMA schema_k8s_container TO postgres;
GRANT ALL ON SCHEMA schema_alerts TO postgres;
