from typing import Literal
import httpx

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from repositories.product_repository import ProductRepository
from schemas.schemas import ProductCreate, ProductUpdate, Product as ProductSchema, HSNResponse
from models.models import Product, Tax


class ProductService:
    def __init__(self, session: AsyncSession):
        self.repo = ProductRepository(session)
        self.session = session

    async def list_products(self):
        products = await self.repo.list()
        return [await self._enrich_with_tax(p) for p in products]

    async def create_product(self, payload: ProductCreate) -> ProductSchema:
        data = payload.model_dump()
        product = await self.repo.create(**data)
        await self.session.commit()
        return await self._enrich_with_tax(product)

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
        return await self._enrich_with_tax(product)

    async def delete_product(self, product_id: UUID) -> None:
        product = await self.get_by_id(product_id)
        if not product:
            raise httpx.HTTPStatusError("Not Found", request=None, response=type("Resp", (), {"status_code": 404})())
        await self.repo.delete(product)
        await self.session.commit()

    async def _enrich_with_tax(self, product: Product) -> ProductSchema:
        """Attach dynamic sales/purchase tax percent values based on tax_name.
        Strategy:
          - If product.tax_name is null -> both percents = 0
          - Query taxes where name = tax_name.
          - A tax may be applicable to sales, purchase, or both via flags.
          - If multiple rows (unlikely), combine: pick one marked sales for sales, one purchase for purchase.
        """
        sales_percent = 0.0
        purchase_percent = 0.0
        if product.tax_name:
            res = await self.session.execute(
                select(Tax).where(Tax.name == product.tax_name)
            )
            rows = res.scalars().all()
            for t in rows:
                # Original Tax model has 'value' or 'rate_percent'? Check attribute gracefully.
                rate = getattr(t, 'value', None)
                if rate is None:
                    rate = getattr(t, 'rate_percent', 0)
                rate_f = float(rate)
                if getattr(t, 'is_applicable_on_sales', False):
                    sales_percent = rate_f
                if getattr(t, 'is_applicable_on_purchase', False):
                    purchase_percent = rate_f
        schema_obj = ProductSchema.model_validate(product, from_attributes=True)
        # Dynamically attach computed fields (they exist in frontend expectation but not persisted)
        # If schema lacks these fields, we can patch via dict since response_model can ignore extras.
        data = schema_obj.model_dump()
        data['sales_tax_percent'] = sales_percent
        data['purchase_tax_percent'] = purchase_percent
        # Return as ProductSchema by reconstructing (will ignore unknown unless configured). To keep extras, we can return dict instead.
        # Simplest: return schema_obj after monkey patching __dict__
        setattr(schema_obj, 'sales_tax_percent', sales_percent)
        setattr(schema_obj, 'purchase_tax_percent', purchase_percent)
        return schema_obj