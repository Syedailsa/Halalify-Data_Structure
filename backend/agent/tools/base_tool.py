from __future__ import annotations

from abc import ABC, abstractmethod

from config import SCORE_THRESHOLD
from schemas.response_schema import ToolResult


class BaseTool(ABC):
    name: str = ""

    @abstractmethod
    async def execute(self, schema, **deps) -> ToolResult: ...


def get_adaptive_threshold(results: list[dict]) -> float:
    if not results:
        return SCORE_THRESHOLD
    scores = [r["score"] for r in results]
    max_score = scores[0]
    mean_score = sum(scores) / len(scores)
    return max(mean_score * 0.95, max_score * 0.88)
