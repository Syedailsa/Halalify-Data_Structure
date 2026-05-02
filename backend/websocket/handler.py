from __future__ import annotations
import traceback
from fastapi import WebSocket
from agent.orchestrator import run_agent
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from services.barcodeService import extract_barcode_schema
from services.visionService import extract_image_schema


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
) -> None:
    if not isinstance(message, dict):
        await _send(ws, {"type": "error", "content": "Malformed message", "code": "INVALID_MESSAGE"})
        return

    msg_type = message.get("type")

    # ── Vision image ──────────────────────────────────────────────────────────
    if msg_type == "image":
        image_data: str = (message.get("image") or "").strip()
        user_prompt: str | None = (message.get("prompt") or "").strip() or None

        if not image_data:
            await _send(ws, {"type": "error", "content": "No image data provided", "code": "EMPTY_IMAGE"})
            return

        print(f"[IMAGE] Received image (~{len(image_data) * 3 // 4 // 1024} KB), prompt={user_prompt!r}")
        try:
            # Step 1: Vision extracts product name and brand from the image
            await _send(ws, {"type": "thinking", "content": "Analyzing image..."})
            schema = await extract_image_schema(image_data)

            # Step 2: Reject images that aren't halal-relevant products
            if not schema.get("is_relevant", True):
                await _stream_text(
                    ws,
                    schema.get("rejection_message")
                    or "I can only assist with halal-related matters. "
                       "This image doesn't appear to be a food, beverage, cosmetic, or pharmaceutical product.",
                )
                return

            # Step 3: Build a search query from the extracted fields
            product_name = (schema.get("product_name") or "").strip()
            brand        = (schema.get("brand") or "").strip()
            agent_query  = " ".join(p for p in [brand, product_name] if p).strip() or "this product"
            search_query = (
                f"{user_prompt.strip()} — product: {agent_query}"
                if user_prompt
                else f"is {agent_query} halal?"
            )

            print(f"[IMAGE] Query built: {search_query!r}")
            await _send(ws, {"type": "thinking", "content": f'Searching "{agent_query}" in halal database...'})

            # Step 4: Hand off to the main agent — it handles everything from here
            # (semantic_search → filter_semantic_results → web_search if needed)
            async for event in run_agent(
                user_query=search_query,
                embed_svc=embed_svc,
                qdrant_svc=qdrant_svc,
            ):
                etype = event.get("type")
                if etype == "thinking":
                    await _send(ws, {"type": "thinking", "content": event.get("content", "Thinking...")})
                elif etype == "tool_call":
                    await _send(ws, {"type": "tool_call", "tool": event.get("tool", ""), "args": event.get("args", {})})
                elif etype == "tool_result":
                    products   = event.get("products", [])
                    web_results = event.get("web_results")
                    if products:
                        await _send(ws, {"type": "products", "products": products[:8], "summary": event.get("summary")})
                    if web_results:
                        await _send(ws, {"type": "products", "products": [], "summary": None, "web_results": web_results})
                elif etype == "token":
                    await _send(ws, {"type": "token", "content": event.get("content", "")})
                elif etype == "done":
                    print(f"[IMAGE] Done responding to: {agent_query!r}")
                    await _send(ws, {"type": "done"})
                elif etype == "error":
                    await _send(ws, {"type": "error", "content": event.get("content", "Unknown error"), "code": event.get("code", "AGENT_ERROR")})

        except Exception:
            traceback.print_exc()
            await _send(ws, {"type": "error", "content": "Image analysis failed", "code": "VISION_ERROR"})
        return

    # ── Barcode / QR ──────────────────────────────────────────────────────────
    if msg_type == "barcode":
        raw: str = (message.get("content") or "").strip()
        if not raw:
            await _send(ws, {"type": "error", "content": "Empty barcode", "code": "EMPTY_BARCODE"})
            return

        print(f"[BARCODE] Scanned: {raw!r}")
        try:
            # Step 1: Classify and extract schema from raw scanned content
            await _send(ws, {"type": "thinking", "content": "Reading scan..."})
            schema = await extract_barcode_schema(raw)

            # Step 2: Reject irrelevant scans
            if not schema.get("is_relevant"):
                await _stream_text(
                    ws,
                    schema.get("rejection_message")
                    or "This scan doesn't appear to be a halal-relevant consumer product. "
                       "Try scanning a barcode on food, beverage, or cosmetic packaging.",
                )
                return

            # Step 3: Build query from schema
            content_type = schema.get("content_type", "")
            product_name = (schema.get("product_name") or "").strip()
            brand        = (schema.get("brand") or "").strip()

            if content_type == "numeric_barcode":
                # Pass the number directly — the agent's filter_semantic_results
                # can match it against the barcodes field in the DB
                search_query = f"is barcode {raw} halal?"
                display_name = raw
            else:
                agent_query  = " ".join(p for p in [brand, product_name] if p).strip() or raw
                search_query = f"is {agent_query} halal?"
                display_name = agent_query

            print(f"[BARCODE] Query built: {search_query!r}")
            await _send(ws, {"type": "thinking", "content": f'Looking up "{display_name}" in halal database...'})

            # Step 4: Hand off to the main agent — same flow as chat/image
            async for event in run_agent(
                user_query=search_query,
                embed_svc=embed_svc,
                qdrant_svc=qdrant_svc,
            ):
                etype = event.get("type")
                if etype == "thinking":
                    await _send(ws, {"type": "thinking", "content": event.get("content", "Thinking...")})
                elif etype == "tool_call":
                    await _send(ws, {"type": "tool_call", "tool": event.get("tool", ""), "args": event.get("args", {})})
                elif etype == "tool_result":
                    products    = event.get("products", [])
                    web_results = event.get("web_results")
                    if products:
                        await _send(ws, {"type": "products", "products": products[:8], "summary": event.get("summary")})
                    if web_results:
                        await _send(ws, {"type": "products", "products": [], "summary": None, "web_results": web_results})
                elif etype == "token":
                    await _send(ws, {"type": "token", "content": event.get("content", "")})
                elif etype == "done":
                    print(f"[BARCODE] Done responding to: {display_name!r}")
                    await _send(ws, {"type": "done"})
                elif etype == "error":
                    await _send(ws, {"type": "error", "content": event.get("content", "Unknown error"), "code": event.get("code", "AGENT_ERROR")})

        except Exception:
            traceback.print_exc()
            await _send(ws, {"type": "error", "content": "Barcode lookup failed", "code": "BARCODE_ERROR"})
        return

    # ── Normal chat message ───────────────────────────────────────────────────
    if msg_type != "message":
        await _send(ws, {"type": "error", "content": "Malformed message", "code": "INVALID_MESSAGE"})
        return

    content = (message.get("content") or "").strip()
    if not content:
        await _send(ws, {"type": "error", "content": "Query cannot be empty", "code": "EMPTY_QUERY"})
        return

    print(f"[CHAT] Query: {content!r}")
    try:
        async for event in run_agent(
            user_query=content,
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
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
                print(f"[CHAT] Done responding to: {content!r}")
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
