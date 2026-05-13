"""create integrity tables

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-05-13 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create integrity_baselines table
    op.create_table('integrity_baselines',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=True),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('sha256_baseline', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create integrity_events table
    op.create_table('integrity_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=True),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('sha256_expected', sa.String(length=64), nullable=True),
        sa.Column('sha256_actual', sa.String(length=64), nullable=True),
        sa.Column('event_type', sa.String(), nullable=True),
        sa.Column('detected_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop integrity_events table
    op.drop_table('integrity_events')

    # Drop integrity_baselines table
    op.drop_table('integrity_baselines')