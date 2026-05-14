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
    """Upgrade schema."""
    # Add missing columns to agents table
    op.add_column('agents', sa.Column('os_version', sa.String(), nullable=True))
    op.add_column('agents', sa.Column('kernel_version', sa.String(), nullable=True))
    op.add_column('agents', sa.Column('last_scan_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove added columns from agents table
    op.drop_column('agents', 'last_scan_at')
    op.drop_column('agents', 'kernel_version')
    op.drop_column('agents', 'os_version')