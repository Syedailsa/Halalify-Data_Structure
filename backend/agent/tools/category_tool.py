from __future__ import annotations

import re

from config import COLLECTION_PRODUCTS, TOP_K
from data.category_map import resolve_category
from schemas.query_schema import CategoryBrowseSchema
from schemas.response_schema import ToolResult
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService

from .base_tool import BaseTool


class CategoryTool(BaseTool):
    name = "category_browse"

    async def execute(
        self,
        schema: CategoryBrowseSchema,
        *,
        embed_svc: EmbedService,
        qdrant_svc: QdrantService,
        **_kwargs,
    ) -> ToolResult:
        mapped = resolve_category(schema.category)
        if not mapped:
            return ToolResult()

        clean_hint = (
            re.sub(
                r"\b(show|me|halal|list|find|get|give|please|products?)\b",
                "",
                schema.hint,
                flags=re.IGNORECASE,
            ).strip()
            or f"{mapped} products"
        )

        vec = await embed_svc.embed(clean_hint)

        # First pass: category + halal only
        results = await qdrant_svc.search(
            COLLECTION_PRODUCTS,
            vec,
            TOP_K,
            [
                {"key": "category_l1", "match": {"value": mapped}},
                {"key": "halal_status", "match": {"value": "Halal"}},
            ],
        )

        # Fallback: no filter, then post-filter by category
        if not results:
            results = await qdrant_svc.search(
                COLLECTION_PRODUCTS, vec, TOP_K * 3, None
            )
            results = [
                r
                for r in results
                if (r["payload"].get("category_l1") or "").lower() == mapped.lower()
            ]

        return ToolResult(results=results)
