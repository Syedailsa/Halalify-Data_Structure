from __future__ import annotations

import re

from config import COLLECTION_PRODUCTS, TOP_K
from schemas.query_schema import GeneralQuerySchema, ProductQuerySchema
from schemas.response_schema import ToolResult
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService

from .base_tool import BaseTool


class ProductTool(BaseTool):
    name = "product_search"

    async def execute(
        self,
        schema: ProductQuerySchema | GeneralQuerySchema,
        *,
        embed_svc: EmbedService,
        qdrant_svc: QdrantService,
        resolved_company: str | None = None,
        classified_company: str | None = None,
        web_search_fn=None,
        original_query: str = "",
    ) -> ToolResult:
        # If classified a company but fuzzy match failed, still search by product
        # name — the "company" might be a brand name (e.g. "kitkat" → Nestlé)
        if classified_company and not resolved_company:
            resolved_company = None  # search without company filter

        if isinstance(schema, GeneralQuerySchema):
            product = schema.query
            category = schema.category
        else:
            product = schema.product
            category = schema.category

        prefix = f"[{category}]" if category else ""
        # Include brand name in embedding for better semantic match
        # e.g. "kitkat chocolate" finds KitKat products better than just "chocolate"
        embed_query = f"{prefix} {classified_company or ''} {product}".strip()
        vec = await embed_svc.embed(embed_query)

        filter_conditions = []
        if category:
            filter_conditions.append(
                {"key": "category_l1", "match": {"value": category}}
            )
        # Company filtering is done via post-filter below (no text index in Qdrant)

        results = await qdrant_svc.search(
            COLLECTION_PRODUCTS, vec, TOP_K, filter_conditions or None
        )

        # Post-filter by resolved company (normalized alphanumeric)
        if resolved_company:
            b = re.sub(r"[^a-z0-9]", "", resolved_company.lower())
            company_filtered = [
                r
                for r in results
                if any(
                    (a := re.sub(r"[^a-z0-9]", "", c.lower()))
                    and (a in b or b in a)
                    for c in (r["payload"].get("companies") or [])
                )
            ]
            if company_filtered:
                results = company_filtered
            # else: company filter matched nothing — return unfiltered results
            # so the LLM can still see relevant products (brand ≠ parent company)

        return ToolResult(results=results)
