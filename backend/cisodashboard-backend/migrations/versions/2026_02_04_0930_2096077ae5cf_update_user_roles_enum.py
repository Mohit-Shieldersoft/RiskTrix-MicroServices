"""update_user_roles_enum

Revision ID: 2096077ae5cf
Revises: add_standard_role
Create Date: 2026-02-04 09:30:06.460438+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2096077ae5cf'
down_revision = 'add_standard_role'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL does not allow using a newly-added enum value in the same
    # transaction that added it. We must commit the ALTER TYPE changes first,
    # then run the data migration in a new transaction.

    connection = op.get_bind()

    # Step 1: Commit the current Alembic transaction so the ALTER TYPE below
    # is committed before we try to use the new values.
    connection.execute(sa.text("COMMIT"))

    # Step 2: Add new enum values (outside of transaction — autocommit mode)
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'INFOSEC_MANAGER'"))
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'EXTERNAL_AUDITOR'"))
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'INTERNAL_AUDITOR'"))

    # Step 3: Begin a new transaction for the data migration
    connection.execute(sa.text("BEGIN"))
    connection.execute(sa.text("UPDATE users SET role = 'SECURITY_ANALYST' WHERE role::text = 'STANDARD'"))
    connection.execute(sa.text("UPDATE users SET role = 'INFOSEC_MANAGER' WHERE role::text = 'COMPLIANCE_OFFICER'"))
    connection.execute(sa.text("UPDATE users SET role = 'INTERNAL_AUDITOR' WHERE role::text = 'AUDITOR'"))
    connection.execute(sa.text("COMMIT"))


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'STANDARD' WHERE role::text = 'SECURITY_ANALYST'")
    op.execute("UPDATE users SET role = 'COMPLIANCE_OFFICER' WHERE role::text = 'INFOSEC_MANAGER'")
    op.execute("UPDATE users SET role = 'AUDITOR' WHERE role::text IN ('INTERNAL_AUDITOR', 'EXTERNAL_AUDITOR')")