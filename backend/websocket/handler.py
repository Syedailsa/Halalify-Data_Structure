from __future__ import annotations
import traceback
from fastapi import WebSocket
from agent.orchestrator import run_agent
from services.company_store import CompanyStore
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from services.visionService import analyze_image
from agent.tools.websearch_tool import web_search as web_search


async def _send(ws: WebSocket, msg: dict) -> None:
    await ws.send_json(msg)


async def _stream_text(ws: WebSocket, text: str, chunk_size: int = 40) -> None:
    for i in range(0, len(text), chunk_size):
        await _send(ws, {"type": "token", "content": text[i: i + chunk_size]})
    await _send(ws, {"type": "done"})


async def handle_ws_message(
    ws: WebSocket,
    message: dict,
    qdrant_svc: QdrantService,
    embed_svc: EmbedService,
    company_store: CompanyStore,
) -> None:
    if not isinstance(message, dict):
        await _send(ws, {"type": "error", "content": "Malformed message", "code": "INVALID_MESSAGE"})
        return

    msg_type = message.get("type")

    if msg_type == "image":
        image_data: str = (message.get("image") or "").strip()
        user_prompt: str | None = (message.get("prompt") or "").strip() or None

        if not image_data:
            await _send(ws, {"type": "error", "content": "No image data provided", "code": "EMPTY_IMAGE"})
            return

        try:
            await _send(ws, {"type": "thinking", "content": "Analyzing image..."})
            result = await analyze_image(image_data, user_prompt)
            await _stream_text(ws, result)
        except Exception:
            traceback.print_exc()
            await _send(ws, {"type": "error", "content": "Vision analysis failed", "code": "VISION_ERROR"})
        return

    if msg_type == "barcode":
        raw: str = (message.get("content") or "").strip()
        if not raw:
            await _send(ws, {"type": "error", "content": "Empty barcode", "code": "EMPTY_BARCODE"})
            return

        # If it's a URL barcode, extract brand from domain
        product_name = raw
        if raw.startswith("http"):
            try:
                from urllib.parse import urlparse
                domain = urlparse(raw).hostname or ""
                product_name = domain.replace("wap.", "").replace("www.", "").split(".")[0]
            except Exception:
                pass

        try:
            await _send(ws, {"type": "thinking", "content": f'Searching "{product_name}" online...'})
            web_results = await web_search(f"{product_name} is Halal?")

            if web_results:
                await _send(ws, {
                    "type": "products",
                    "products": [],
                    "summary": None,
                    "web_results": web_results,
                })
                await _stream_text(
                    ws,
                    f'I couldn\'t find "{product_name}" in the verified database, '
                    f"so here are the top web results for its halal status:"
                )
            else:
                await _stream_text(
                    ws,
                    f'Sorry, I couldn\'t find halal certification info for "{product_name}". '
                    "Try checking with the manufacturer or a halal certification body."
                )
        except Exception:
            traceback.print_exc()
            await _send(ws, {"type": "error", "content": "Barcode lookup failed", "code": "BARCODE_ERROR"})
        return

    if msg_type != "message":
        await _send(ws, {"type": "error", "content": "Malformed message", "code": "INVALID_MESSAGE"})
        return

    content = (message.get("content") or "").strip()
    if not content:
        await _send(ws, {"type": "error", "content": "Query cannot be empty", "code": "EMPTY_QUERY"})
        return

    try:
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
        await _send(ws, {"type": "error", "content": "Internal server error", "code": "INTERNAL_ERROR"})
