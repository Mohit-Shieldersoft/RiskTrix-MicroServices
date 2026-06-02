"""Create automation tables

Revision ID: e5b8a2c71f90
Revises: d4a9f0b6c123
Create Date: 2026-05-28 10:00:00.000000+00:00

Matches the real table shape already deployed in production:
  automation_rules      — conditions_json / actions_json (not conditions/actions)
  automation_executions — rule_name, trigger_type, actions_taken, detail
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "e5b8a2c71f90"
down_revision = "d4a9f0b6c123"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    """Return True if table already exists (idempotency guard)."""
    from sqlalchemy import inspect
    conn = op.get_bind()
    return inspect(conn).has_table(table_name)


def upgrade() -> None:
    # ── automation_rules ─────────────────────────────────────────────────────
    if not _table_exists("automation_rules"):
        op.create_table(
            "automation_rules",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.String(length=1000), nullable=True),
            sa.Column("trigger_type", sa.String(length=50), nullable=False, server_default="manual"),
            # Stored as JSON, ORM maps Python attribute `conditions` → DB column `conditions_json`
            sa.Column("conditions_json", sa.JSON(), nullable=True),
            # Stored as JSON, ORM maps Python attribute `actions`    → DB column `actions_json`
            sa.Column("actions_json", sa.JSON(), nullable=True),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_by", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=False), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=False), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_automation_rules_id"), "automation_rules", ["id"], unique=False)

    # ── automation_executions ────────────────────────────────────────────────
    if not _table_exists("automation_executions"):
        op.create_table(
            "automation_executions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column(
                "rule_id",
                sa.Integer(),
                sa.ForeignKey("automation_rules.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("rule_name", sa.String(length=255), nullable=False),
            sa.Column("trigger_type", sa.String(length=50), nullable=False),
            sa.Column("device_id", sa.Integer(), nullable=True),
            sa.Column("actions_taken", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(length=20), nullable=True),
            sa.Column("detail", sa.Text(), nullable=True),
            sa.Column("executed_at", sa.DateTime(timezone=False), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_automation_executions_id"), "automation_executions", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_automation_executions_rule_id"), "automation_executions", ["rule_id"], unique=False
        )
        op.create_index(
            op.f("ix_automation_executions_device_id"), "automation_executions", ["device_id"], unique=False
        )


def downgrade() -> None:
    if _table_exists("automation_executions"):
        op.drop_index(op.f("ix_automation_executions_device_id"), table_name="automation_executions")
        op.drop_index(op.f("ix_automation_executions_rule_id"), table_name="automation_executions")
        op.drop_index(op.f("ix_automation_executions_id"), table_name="automation_executions")
        op.drop_table("automation_executions")

    if _table_exists("automation_rules"):
        op.drop_index(op.f("ix_automation_rules_id"), table_name="automation_rules")
        op.drop_table("automation_rules")
