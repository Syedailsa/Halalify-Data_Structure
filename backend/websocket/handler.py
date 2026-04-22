from __future__ import annotations

import traceback

from fastapi import WebSocket

from agent.orchestrator import run_agent
from services.company_store import CompanyStore
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService


async def _send(ws: WebSocket, msg: dict) -> None:
    await ws.send_json(msg)


async def handle_ws_message(
    ws: WebSocket,
    message: dict,
    qdrant_svc: QdrantService,
    embed_svc: EmbedService,
    company_store: CompanyStore,
) -> None:
    # ── Validate ─────────────────────────────────────────────────────────
    if not isinstance(message, dict) or message.get("type") != "message":
        await _send(ws, {"type": "error", "content": "Malformed message", "code": "INVALID_MESSAGE"})
        return

    content = (message.get("content") or "").strip()
    if not content:
        await _send(ws, {"type": "error", "content": "Query cannot be empty", "code": "EMPTY_QUERY"})
        return

    try:
        # ── Run the agent and forward events to WebSocket ────────────────
        async for event in run_agent(
            user_query=content,
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
            company_store=company_store,
        ):
            event_type = event.get("type")

            if event_type == "thinking":
                await _send(ws, {"type": "thinking", "content": event.get("content", "Thinking...")})

            elif event_type == "tool_call":
                await _send(ws, {"type": "tool_call", "tool": event.get("tool", ""), "args": event.get("args", {})})

            elif event_type == "tool_result":
                # Send product cards to frontend
                products = event.get("products", [])
                summary = event.get("summary")
                web_results = event.get("web_results")

                if products:
                    await _send(ws, {
                        "type": "products",
                        "products": products[:8],
                        "summary": summary,
                    })

                if web_results:
                    await _send(ws, {
                        "type": "products",
                        "products": [],
                        "summary": None,
                        "web_results": web_results,
                    })

            elif event_type == "token":
                await _send(ws, {"type": "token", "content": event.get("content", "")})

            elif event_type == "done":
                await _send(ws, {"type": "done"})

            elif event_type == "error":
                await _send(ws, {
                    "type": "error",
                    "content": event.get("content", "Unknown error"),
                    "code": event.get("code", "AGENT_ERROR"),
                })

    except Exception:
        traceback.print_exc()
        await _send(ws, {
            "type": "error",
            "content": "Internal server error",
            "code": "INTERNAL_ERROR",
        })
