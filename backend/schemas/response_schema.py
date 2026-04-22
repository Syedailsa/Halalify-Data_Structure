from __future__ import annotations

from pydantic import BaseModel


class ToolResult(BaseModel):
    results: list[dict] = []
    summary: dict | None = None
    not_in_database: bool = False
    web_results: str | None = None
    fuzzy_warning: str | None = None


class WSMessage(BaseModel):
    type: str  # thinking | tool_call | products | token | done | error
    content: str | None = None
    tool: str | None = None
    products: list[dict] | None = None
    summary: dict | None = None
    code: str | None = None
    web_results: str | None = None
