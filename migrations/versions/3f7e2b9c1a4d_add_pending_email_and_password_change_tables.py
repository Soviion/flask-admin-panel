"""add pending email and password change tables

Revision ID: 3f7e2b9c1a4d
Revises: e982c7d2dd69
Create Date: 2026-03-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3f7e2b9c1a4d"
down_revision = "e982c7d2dd69"
branch_labels = None
depends_on = None


def _table_exists(inspector, table_name):
    return table_name in inspector.get_table_names()


def _index_exists(inspector, table_name, index_name):
    return any(idx.get("name") == index_name for idx in inspector.get_indexes(table_name))


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, "pending_email_changes"):
        op.create_table(
            "pending_email_changes",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("new_email", sa.String(length=120), nullable=False),
            sa.Column("code", sa.String(length=6), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        )

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "pending_email_changes") and not _index_exists(
        inspector, "pending_email_changes", "ix_pending_email_changes_user_id"
    ):
        op.create_index(
            "ix_pending_email_changes_user_id",
            "pending_email_changes",
            ["user_id"],
            unique=False,
        )

    inspector = sa.inspect(bind)
    if not _table_exists(inspector, "pending_password_changes"):
        op.create_table(
            "pending_password_changes",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("new_password_hash", sa.String(length=255), nullable=False),
            sa.Column("code", sa.String(length=6), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        )

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "pending_password_changes") and not _index_exists(
        inspector, "pending_password_changes", "ix_pending_password_changes_user_id"
    ):
        op.create_index(
            "ix_pending_password_changes_user_id",
            "pending_password_changes",
            ["user_id"],
            unique=False,
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "pending_password_changes"):
        if _index_exists(inspector, "pending_password_changes", "ix_pending_password_changes_user_id"):
            op.drop_index("ix_pending_password_changes_user_id", table_name="pending_password_changes")
        op.drop_table("pending_password_changes")

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "pending_email_changes"):
        if _index_exists(inspector, "pending_email_changes", "ix_pending_email_changes_user_id"):
            op.drop_index("ix_pending_email_changes_user_id", table_name="pending_email_changes")
        op.drop_table("pending_email_changes")
