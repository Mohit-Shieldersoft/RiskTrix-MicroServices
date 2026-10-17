"""add last_scan_at to agents table

Revision ID: add_last_scan_at
Revises: b5a88a967ef4
Create Date: 2026-05-13 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_last_scan_at'
down_revision: str = 'b5a88a967ef4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — idempotent: uses IF NOT EXISTS to avoid DuplicateColumnError
    when the initial migration already included these columns."""
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS os_version VARCHAR"
    ))
    conn.execute(sa.text(
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS kernel_version VARCHAR"
    ))
    conn.execute(sa.text(
        "ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMP"
    ))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE agents DROP COLUMN IF EXISTS last_scan_at"
    ))
    conn.execute(sa.text(
        "ALTER TABLE agents DROP COLUMN IF EXISTS kernel_version"
    ))
    conn.execute(sa.text(
        "ALTER TABLE agents DROP COLUMN IF EXISTS os_version"
    ))