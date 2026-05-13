"""add scan_requests table

Revision ID: b5a88a967ef4
Revises: 5917ea617932
Create Date: 2026-05-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5a88a967ef4'
down_revision: Union[str, Sequence[str], None] = '5917ea617932'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create scan_requests table
    op.create_table('scan_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=False),
        sa.Column('requested_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('scan_type', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop scan_requests table
    op.drop_table('scan_requests')