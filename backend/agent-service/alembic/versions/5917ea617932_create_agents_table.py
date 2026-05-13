"""Create agents table

Revision ID: 5917ea617932
Revises:
Create Date: 2026-05-11 16:37:30.540624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5917ea617932'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create agents table
    op.create_table('agents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('hostname', sa.String(), nullable=False),
        sa.Column('os', sa.String(), nullable=False),
        sa.Column('arch', sa.String(), nullable=False),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('agent_version', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True),
        sa.Column('registered_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop agents table
    op.drop_table('agents')
