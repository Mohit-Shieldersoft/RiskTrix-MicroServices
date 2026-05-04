"""Add impact column to vulnerabilities

Revision ID: 58c105efb762
Revises: be2c37d28dbf
Create Date: 2026-03-25 10:25:59.192660+00:00

NOTE: The original auto-generated version of this file was entirely commented
out, which broke the Alembic migration chain because downstream migration
b7f2c8d91a43 declares this as its down_revision.  This replacement restores
the chain and adds only the single column that was missing: vulnerabilities.impact.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '58c105efb762'
down_revision = 'be2c37d28dbf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('vulnerabilities', sa.Column('impact', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('vulnerabilities', 'impact')
