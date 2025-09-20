"""add taxes table

Revision ID: 002
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    # Create taxes table
    op.create_table(
        'taxes',
        sa.Column('id', postgresql.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('rate_percent', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('is_applicable_on_sales', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_applicable_on_purchase', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('taxes')