from __future__ import annotations

from pydantic import BaseModel


class CompanyQuerySchema(BaseModel):
    intent: str = "company_inquiry"
    company: str
    category: str | None = None


class ProductQuerySchema(BaseModel):
    intent: str = "product_inquiry"
    product: str
    company: str | None = None
    category: str | None = None


class ENumberQuerySchema(BaseModel):
    intent: str = "enumber_lookup"
    e_code: str


class CategoryBrowseSchema(BaseModel):
    intent: str = "category_browse"
    category: str
    hint: str


class GeneralQuerySchema(BaseModel):
    intent: str = "general"
    query: str
    category: str | None = None
