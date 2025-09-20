"""add product tax percent columns

Revision ID: 004_add_product_tax_percents
Revises: 003_update_taxes
Create Date: 2025-09-20 15:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_add_product_tax_percents'
down_revision = '003_update_taxes'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add new columns with default 0.00
    op.add_column('products', sa.Column('sales_tax_percent', sa.Numeric(5, 2), server_default='0', nullable=False))
    op.add_column('products', sa.Column('purchase_tax_percent', sa.Numeric(5, 2), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('products', 'purchase_tax_percent')
    op.drop_column('products', 'sales_tax_percent')
