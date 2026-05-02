from __future__ import annotations
import re
import traceback
from fastapi import WebSocket
from agent.orchestrator import run_agent
from services.company_store import CompanyStore
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from services.visionService import analyze_image, extract_image_schema, VISION_FALLBACK_PROMPT

def _barcode_filter_products(products: list[dict], product_name: str) -> list[dict]:
    """Keep only products whose norm_name contains at least one keyword from the scan."""
    kws = set(re.sub(r"[^a-z0-9]", " ", product_name.lower()).split())
    kws.discard("")
    if not kws:
        return products
    return [
        p for p in products
        if any(kw in re.sub(r"[^a-z0-9]", "", (p.get("norm_name") or "").lower()) for kw in kws)
    ]


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

    # ── Vision image ──────────────────────────────────────────────────────────
    if msg_type == "image":
        image_data: str = (message.get("image") or "").strip()
        user_prompt: str | None = (message.get("prompt") or "").strip() or None
        image_kb = len(image_data) * 3 // 4 // 1024

        if not image_data:
            await _send(ws, {"type": "error", "content": "No image data provided", "code": "EMPTY_IMAGE"})
            return

        print(f"[IMAGE] Received image (~{image_kb} KB), prompt={user_prompt!r}")
        try:
            # ── Step 1: Extract structured schema ─────────────────────────────
            await _send(ws, {"type": "thinking", "content": "Analyzing image..."})
            schema = await extract_image_schema(image_data)

            # ── Step 2: Reject irrelevant images ──────────────────────────────
            if not schema.get("is_relevant", True):
                msg = (
                    schema.get("rejection_message")
                    or "I can only assist with halal-related matters. "
                       "This image doesn't appear to be a food, beverage, cosmetic, or pharmaceutical product."
                )
                await _stream_text(ws, msg)
                return

            # ── Step 3: Build search query from extracted fields ───────────────
            product_name = (schema.get("product_name") or "").strip()
            brand = (schema.get("brand") or "").strip()
            agent_query = " ".join(p for p in [brand, product_name] if p).strip()

            # ── Step 4: Try DB search via agent if we have a product/brand ─────
            agent_has_data = False
            if agent_query:
                search_query = (
                    f"{user_prompt.strip()} — product: {agent_query}"
                    if user_prompt
                    else f"is {agent_query} halal?"
                )
                await _send(ws, {"type": "thinking", "content": f'Searching "{agent_query}" in halal database...'})
                token_buffer: list[str] = []

                async for event in run_agent(
                    user_query=search_query,
                    embed_svc=embed_svc,
                    qdrant_svc=qdrant_svc,
                    company_store=company_store,
                ):
                    etype = event.get("type")

                    if etype in ("thinking", "tool_call"):
                        await _send(ws, event)

                    elif etype == "token":
                        token_buffer.append(event.get("content", ""))

                    elif etype == "tool_result":
                        products = event.get("products", [])
                        web_results = event.get("web_results")
                        if products or web_results:
                            agent_has_data = True
                            for t in token_buffer:
                                await _send(ws, {"type": "token", "content": t})
                            token_buffer.clear()
                        if products:
                            await _send(ws, {
                                "type": "products",
                                "products": products[:8],
                                "summary": event.get("summary"),
                            })
                        if web_results:
                            await _send(ws, {
                                "type": "products",
                                "products": [],
                                "summary": None,
                                "web_results": web_results,
                            })

                    elif etype == "done":
                        if agent_has_data:
                            for t in token_buffer:
                                await _send(ws, {"type": "token", "content": t})
                            token_buffer.clear()
                            await _send(ws, {"type": "done"})

                    elif etype == "error":
                        await _send(ws, {
                            "type": "error",
                            "content": event.get("content", "Unknown error"),
                            "code": event.get("code", "AGENT_ERROR"),
                        })

            # ── Step 5: Vision fallback if DB had no match ────────────────────
            if not agent_has_data:
                print(f"[IMAGE] No DB match for {agent_query!r} — running vision fallback")
                await _send(ws, {"type": "thinking", "content": "Analyzing ingredients and halal status from image..."})
                fallback_prompt = user_prompt or VISION_FALLBACK_PROMPT
                vision_result = await analyze_image(image_data, fallback_prompt)
                
                print(f"[IMAGE] Vision fallback complete ({len(vision_result)} chars)")
                await _stream_text(ws, vision_result)

        except Exception:
            traceback.print_exc()
            await _send(ws, {"type": "error", "content": "Vision analysis failed", "code": "VISION_ERROR"})
        return

    # ── Barcode / QR ──────────────────────────────────────────────────────────
    if msg_type == "barcode":
        raw: str = (message.get("content") or "").strip()
        if not raw:
            await _send(ws, {"type": "error", "content": "Empty barcode", "code": "EMPTY_BARCODE"})
            return

        product_name = raw
        if raw.startswith("http"):
            try:
                from urllib.parse import urlparse
                domain = urlparse(raw).hostname or ""
                product_name = domain.replace("wap.", "").replace("www.", "").split(".")[0]
            except Exception:
                pass

        print(f"[BARCODE] Scanned: {raw!r} → searching as {product_name!r}")
        barcode_query = f"is {product_name} halal?"
        try:
            await _send(ws, {"type": "thinking", "content": f'Looking up "{product_name}" in halal database...'})
            async for event in run_agent(
                user_query=barcode_query,
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
                        matched = _barcode_filter_products(products, product_name)
                        if matched:
                            await _send(ws, {
                                "type": "products",
                                "products": matched[:8],
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
                    print(f"[BARCODE] Done responding to: {product_name!r}")
                    await _send(ws, {"type": "done"})

                elif event_type == "error":
                    await _send(ws, {
                        "type": "error",
                        "content": event.get("content", "Unknown error"),
                        "code": event.get("code", "AGENT_ERROR"),
                    })

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
