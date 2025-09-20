from typing import Literal
import httpx

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from repositories.product_repository import ProductRepository
from schemas.schemas import ProductCreate, ProductUpdate, Product as ProductSchema, HSNResponse
from models.models import Product


class ProductService:
    def __init__(self, session: AsyncSession):
        self.repo = ProductRepository(session)
        self.session = session

    async def list_products(self):
        products = await self.repo.list()
        return [ProductSchema.model_validate(p, from_attributes=True) for p in products]

    async def create_product(self, payload: ProductCreate) -> ProductSchema:
        data = payload.model_dump()
        product = await self.repo.create(**data)
        await self.session.commit()
        return ProductSchema.model_validate(product, from_attributes=True)

    async def hsn_search(self, query: str, mode: Literal['byCode', 'byDesc'] = 'byCode', category: str | None = None) -> HSNResponse:
        base_url = "https://services.gst.gov.in/commonservices/hsn/search/qsearch"
        params = {
            "inputText": query,
            "selectedType": mode,
            "category": category or "null"
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
        # Expected shape already matches { "data": [ { "c": "1001", "n": "..." } ] }
        return HSNResponse.model_validate(data)

    async def get_by_id(self, product_id: UUID) -> Product | None:
        res = await self.session.execute(select(Product).where(Product.id == product_id))
        return res.scalar_one_or_none()

    async def update_product(self, product_id: UUID, payload: ProductUpdate) -> ProductSchema:
        product = await self.get_by_id(product_id)
        if not product:
            raise httpx.HTTPStatusError("Not Found", request=None, response=type("Resp", (), {"status_code": 404})())
        data = payload.model_dump(exclude_unset=True)
        product = await self.repo.update(product, **data)
        await self.session.commit()
        return ProductSchema.model_validate(product, from_attributes=True)

    async def delete_product(self, product_id: UUID) -> None:
        product = await self.get_by_id(product_id)
        if not product:
            raise httpx.HTTPStatusError("Not Found", request=None, response=type("Resp", (), {"status_code": 404})())
        await self.repo.delete(product)
        await self.session.commit()