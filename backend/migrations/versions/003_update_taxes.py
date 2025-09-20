"""add is_active and updated_at to taxes

Revision ID: 003_update_taxes
Create Date: 2023-09-20 12:02:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Add is_active column with default true
    op.add_column('taxes', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    
    # Add updated_at column
    op.add_column('taxes', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

def downgrade() -> None:
    op.drop_column('taxes', 'updated_at')
    op.drop_column('taxes', 'is_active')