from __future__ import annotations

import httpx

from config import EMBED_MODEL


class EmbedService:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def embed(self, text: str) -> list[float]:
        if not self.api_key:
            raise RuntimeError("FIREWORKS_API_KEY is missing from .env.local")

        res = await self.client.post(
            "https://api.fireworks.ai/inference/v1/embeddings",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={"model": EMBED_MODEL, "input": [text]},
        )

        data = res.json()
        if res.status_code != 200 or not data.get("data", [{}])[0].get("embedding"):
            raise RuntimeError(f"Embedding API error: {data}")

        return data["data"][0]["embedding"]

    async def close(self) -> None:
        await self.client.aclose()
