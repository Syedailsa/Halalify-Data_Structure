from __future__ import annotations

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    FieldCondition,
    Filter,
    MatchText,
    MatchValue,
)


class QdrantService:
    def __init__(self, url: str, api_key: str) -> None:
        self.client = AsyncQdrantClient(
            url=url,
            api_key=api_key or None,
            prefer_grpc=False,
            timeout=60,
        )

    async def search(
        self,
        collection: str,
        vector: list[float],
        limit: int,
        filter_conditions: list[dict] | None = None,
    ) -> list[dict]:
        qfilter = None
        if filter_conditions:
            must = []
            for cond in filter_conditions:
                key = cond["key"]
                if "text" in cond.get("match", {}):
                    must.append(
                        FieldCondition(
                            key=key, match=MatchText(text=cond["match"]["text"])
                        )
                    )
                else:
                    must.append(
                        FieldCondition(
                            key=key, match=MatchValue(value=cond["match"]["value"])
                        )
                    )
            qfilter = Filter(must=must)

        try:
            response = await self.client.query_points(
                collection_name=collection,
                query=vector,
                limit=limit,
                with_payload=True,
                query_filter=qfilter,
            )
        except Exception as e:
            print(f"[QdrantService] search error on '{collection}': {e}")
            return []
        return [
            {"score": point.score, "payload": point.payload}
            for point in response.points
        ]

    async def scroll(
        self,
        collection: str,
        filter_conditions: list[dict],
        limit: int = 5,
    ) -> list[dict]:
        must = []
        for cond in filter_conditions:
            key = cond["key"]
            must.append(
                FieldCondition(
                    key=key, match=MatchValue(value=cond["match"]["value"])
                )
            )
        qfilter = Filter(must=must)

        try:
            points, _ = await self.client.scroll(
                collection_name=collection,
                scroll_filter=qfilter,
                limit=limit,
                with_payload=True,
            )
        except Exception as e:
            print(f"[QdrantService] scroll error on '{collection}': {e}")
            return []
        return [{"score": 1.0, "payload": point.payload} for point in points]

    async def close(self) -> None:
        await self.client.close()
