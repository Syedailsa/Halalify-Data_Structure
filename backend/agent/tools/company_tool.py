from __future__ import annotations

from config import COLLECTION_PRODUCTS, TOP_K
from schemas.query_schema import CompanyQuerySchema
from schemas.response_schema import ToolResult
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService

from .base_tool import BaseTool


class CompanyTool(BaseTool):
    name = "company_search"

    async def execute(
        self,
        schema: CompanyQuerySchema,
        *,
        embed_svc: EmbedService,
        qdrant_svc: QdrantService,
        web_search_fn=None,
        original_query: str = "",
    ) -> ToolResult:
        company = schema.company
        category = schema.category

        vec = await embed_svc.embed(f"[{category or ''}] {company} products")

        filter_conditions = []
        if category:
            filter_conditions.append(
                {"key": "category_l1", "match": {"value": category}}
            )

        results = await qdrant_svc.search(
            COLLECTION_PRODUCTS, vec, TOP_K * 2, filter_conditions or None
        )

        # Post-filter by company name (substring both ways)
        company_lower = company.lower()
        company_results = [
            r
            for r in results
            if any(
                c.lower() in company_lower or company_lower in c.lower()
                for c in (r["payload"].get("companies") or [])
            )
        ]

        if company_results:
            results = company_results
            halal = sum(
                1 for r in results if r["payload"].get("halal_status") == "Halal"
            )
            haram = sum(
                1 for r in results if r["payload"].get("halal_status") == "Haraam"
            )
            mushbooh = sum(
                1 for r in results if r["payload"].get("halal_status") == "Mushbooh"
            )
            return ToolResult(
                results=results,
                summary={
                    "company": company,
                    "halal": halal,
                    "haram": haram,
                    "mushbooh": mushbooh,
                },
            )

        # No company match found — web fallback
        web_results = None
        if web_search_fn:
            web_results = await web_search_fn(original_query)
        return ToolResult(
            results=results,
            not_in_database=True,
            web_results=web_results,
        )
