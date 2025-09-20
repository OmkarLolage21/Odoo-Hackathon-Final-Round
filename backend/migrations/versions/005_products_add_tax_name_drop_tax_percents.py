"""add tax_name to products and drop tax percents

Revision ID: 005_products_add_tax_name_drop_tax_percents
Revises: 004_add_product_tax_percents
Create Date: 2025-09-20 17:05:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '005_products_add_tax_name_drop_tax_percents'
down_revision = '004_add_product_tax_percents'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add tax_name
    op.add_column('products', sa.Column('tax_name', sa.String(length=100), nullable=True))
    # Drop old percent columns if exist
    with op.get_context().autocommit_block():
        conn = op.get_bind()
        # Check existence before dropping (Postgres dialect)
        for col in ('sales_tax_percent', 'purchase_tax_percent'):
            res = conn.execute(sa.text("SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name=:c"), {'c': col}).fetchone()
            if res:
                op.drop_column('products', col)

def downgrade() -> None:
    # Recreate the percent columns (default 0) and drop tax_name
    op.add_column('products', sa.Column('sales_tax_percent', sa.Numeric(5,2), server_default='0', nullable=False))
    op.add_column('products', sa.Column('purchase_tax_percent', sa.Numeric(5,2), server_default='0', nullable=False))
    op.drop_column('products', 'tax_name')
