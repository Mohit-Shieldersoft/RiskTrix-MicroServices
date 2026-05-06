"""Restore exception user link columns

Revision ID: b7f2c8d91a43
Revises: 58c105efb762
Create Date: 2026-04-23 09:15:00.000000+00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b7f2c8d91a43"
down_revision = "58c105efb762"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Restore the exception ownership columns expected by app.models.models.Exception.
    # A previous migration dropped these columns while the application code still
    # selects them for creator/assignee tracking, causing /api/v1/exceptions/ to fail
    # with UndefinedColumnError in PostgreSQL.
    op.add_column("exceptions", sa.Column("created_by_id", sa.Integer(), nullable=True))
    op.add_column("exceptions", sa.Column("assigned_to_id", sa.Integer(), nullable=True))

    op.create_foreign_key(
        "exceptions_created_by_id_fkey",
        "exceptions",
        "users",
        ["created_by_id"],
        ["id"],
    )
    op.create_foreign_key(
        "exceptions_assigned_to_id_fkey",
        "exceptions",
        "users",
        ["assigned_to_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("exceptions_assigned_to_id_fkey", "exceptions", type_="foreignkey")
    op.drop_constraint("exceptions_created_by_id_fkey", "exceptions", type_="foreignkey")
    op.drop_column("exceptions", "assigned_to_id")
    op.drop_column("exceptions", "created_by_id")
