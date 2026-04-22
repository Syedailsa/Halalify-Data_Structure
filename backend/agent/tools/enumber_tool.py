from __future__ import annotations

from config import COLLECTION_ENUMBERS
from schemas.query_schema import ENumberQuerySchema
from schemas.response_schema import ToolResult
from services.qdrant_client import QdrantService

from .base_tool import BaseTool


class ENumberTool(BaseTool):
    name = "enumber_lookup"

    async def execute(
        self,
        schema: ENumberQuerySchema,
        *,
        qdrant_svc: QdrantService,
        **_kwargs,
    ) -> ToolResult:
        e_code = schema.e_code.upper()
        if not e_code.startswith("E"):
            e_code = f"E{e_code}"

        results = await qdrant_svc.scroll(
            COLLECTION_ENUMBERS,
            [{"key": "e_code", "match": {"value": e_code}}],
            limit=5,
        )
        return ToolResult(results=results)
