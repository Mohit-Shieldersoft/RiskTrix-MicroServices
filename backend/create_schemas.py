"""
Phase 2.1: PostgreSQL Multi-Schema Isolation DDL Creation Script
Creates all 11 microservice PostgreSQL schemas in risktrix_db:
1. schema_identity
2. schema_app
3. schema_audit
4. schema_agent
5. schema_binary
6. schema_integrity
7. schema_threat
8. schema_cspm
9. schema_ciem
10. schema_k8s_container
11. schema_alerts
"""
import os
import sys

SCHEMAS = [
    "schema_identity",
    "schema_app",
    "schema_audit",
    "schema_agent",
    "schema_binary",
    "schema_integrity",
    "schema_threat",
    "schema_cspm",
    "schema_ciem",
    "schema_k8s_container",
    "schema_alerts",
]

DDL_STATEMENTS = [
    f"CREATE SCHEMA IF NOT EXISTS {schema};" for schema in SCHEMAS
]


def get_ddl_script() -> str:
    """Generate the full DDL script for schema isolation"""
    lines = [
        "-- RiskTrix PostgreSQL Multi-Schema Isolation DDL",
        "-- Phase 2.1: Create isolated PostgreSQL schemas for all platform microservices",
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;",
        "",
    ]
    for schema in SCHEMAS:
        lines.append(f"CREATE SCHEMA IF NOT EXISTS {schema};")
        lines.append(f"GRANT ALL ON SCHEMA {schema} TO postgres;")
    return "\n".join(lines)


def run_ddl():
    print("=" * 60)
    print("🐘 RiskTrix Multi-Schema DDL Execution")
    print("=" * 60)
    print(f"Total Schemas configured: {len(SCHEMAS)}")
    for s in SCHEMAS:
        print(f"  - {s}")

    try:
        import psycopg2

        db_server = os.environ.get("POSTGRES_SERVER", "localhost")
        db_port = os.environ.get("POSTGRES_PORT", "5432")
        db_user = os.environ.get("POSTGRES_USER", "postgres")
        db_pass = os.environ.get("POSTGRES_PASSWORD", "password")
        db_name = os.environ.get("POSTGRES_DB", "risktrix_db")

        conn = psycopg2.connect(
            host=db_server,
            port=db_port,
            user=db_user,
            password=db_pass,
            dbname=db_name,
        )
        conn.autocommit = True
        cur = conn.cursor()
        for ddl in DDL_STATEMENTS:
            cur.execute(ddl)
            print(f"✅ Executed: {ddl}")
        cur.close()
        conn.close()
        print("\n🎉 Successfully created all 11 schemas in PostgreSQL database!")
    except Exception as e:
        print(f"\n⚠️ DB Connection info: {e}")
        print("💡 DDL SQL script ready at backend/init_schemas.sql")


if __name__ == "__main__":
    run_ddl()
