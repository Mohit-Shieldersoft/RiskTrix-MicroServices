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
    # PostgreSQL requires ALTER TYPE ADD VALUE to be in its own transaction
    # Use op.execute() for each ALTER TYPE statement
    
    # Add new enum values
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'INFOSEC_MANAGER'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'EXTERNAL_AUDITOR'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'INTERNAL_AUDITOR'")
    
    # Note: Data migrations must be done in a separate transaction after enum values are committed
    # Skip the UPDATE statements as they would fail with "unsafe use of new enum value" error
    # Users with old roles should be migrated manually or in a separate operation
    # 
    # AUDITOR -> INTERNAL_AUDITOR (you can change to EXTERNAL_AUDITOR if needed)
    # op.execute("UPDATE users SET role = 'INTERNAL_AUDITOR' WHERE role = 'AUDITOR'")
    
    # Step 3: Note - We cannot remove old enum values in PostgreSQL easily
    # Old values (STANDARD, COMPLIANCE_OFFICER, AUDITOR) will remain in the enum
    # but won't be used. To fully remove them, you'd need to recreate the enum,
    # which requires dropping and recreating the table or using a complex workaround.


def downgrade() -> None:
    # Note: Removing enum values is not supported in PostgreSQL within a transaction
    # Downgrading enum types requires recreating the type or manual intervention
    pass