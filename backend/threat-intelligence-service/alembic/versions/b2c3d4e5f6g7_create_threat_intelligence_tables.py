"""create threat intelligence tables

Revision ID: b2c3d4e5f6g7
Revises:
Create Date: 2026-05-13 13:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create cve_findings table
    op.create_table('cve_findings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=True),
        sa.Column('cve_id', sa.String(), nullable=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('cvss_score', sa.Float(), nullable=True),
        sa.Column('affected_binary', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('detected_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create ioc_matches table
    op.create_table('ioc_matches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=True),
        sa.Column('ioc_type', sa.String(), nullable=True),
        sa.Column('ioc_value', sa.String(), nullable=False),
        sa.Column('threat_name', sa.String(), nullable=True),
        sa.Column('confidence', sa.Integer(), nullable=True),
        sa.Column('matched_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop ioc_matches table
    op.drop_table('ioc_matches')

    # Drop cve_findings table
    op.drop_table('cve_findings')