"""Create vendor certificates table

Revision ID: d4a9f0b6c123
Revises: b7f2c8d91a43
Create Date: 2026-04-23 09:30:00.000000+00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "d4a9f0b6c123"
down_revision = "b7f2c8d91a43"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the vendor_certificates table expected by VendorCertificate and the
    # Application/Vendor certificates relationships. The audit PCI-DSS endpoint
    # eager-loads Application.certificates, so a missing table causes
    # /api/v1/audit/pcidss-compliance to fail with UndefinedTableError.
    op.create_table(
        "vendor_certificates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("certificate_type", sa.String(length=100), nullable=False),
        sa.Column("certificate_number", sa.String(length=255), nullable=True),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "COMPLIANT",
                "NON_COMPLIANT",
                "PENDING",
                "EXCEPTION",
                "NOT_APPLICABLE",
                name="compliancestatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("issuing_authority", sa.String(length=255), nullable=True),
        sa.Column("certificate_url", sa.String(length=500), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("vendor_id", sa.Integer(), nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vendor_certificates_id"), "vendor_certificates", ["id"], unique=False)
    op.create_index("idx_vendor_certificates_application_id", "vendor_certificates", ["application_id"], unique=False)
    op.create_index("idx_vendor_certificates_expiry_date", "vendor_certificates", ["expiry_date"], unique=False)
    op.create_index("idx_vendor_certificates_status", "vendor_certificates", ["status"], unique=False)
    op.create_index("idx_vendor_certificates_vendor_id", "vendor_certificates", ["vendor_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_vendor_certificates_vendor_id", table_name="vendor_certificates")
    op.drop_index("idx_vendor_certificates_status", table_name="vendor_certificates")
    op.drop_index("idx_vendor_certificates_expiry_date", table_name="vendor_certificates")
    op.drop_index("idx_vendor_certificates_application_id", table_name="vendor_certificates")
    op.drop_index(op.f("ix_vendor_certificates_id"), table_name="vendor_certificates")
    op.drop_table("vendor_certificates")
