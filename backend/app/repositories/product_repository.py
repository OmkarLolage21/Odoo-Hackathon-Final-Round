from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import Product


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, **data) -> Product:
        product = Product(**data)
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def get(self, product_id: UUID) -> Optional[Product]:
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def list(self) -> List[Product]:
        result = await self.session.execute(select(Product).order_by(Product.created_at.desc()))
        return list(result.scalars())

    async def update(self, product: Product, **data) -> Product:
        for field, value in data.items():
            setattr(product, field, value)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def delete(self, product: Product) -> None:
        await self.session.delete(product)