from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from websocket.handler import handle_ws_message
from websocket.manager import ConnectionManager


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print("Starting Halalify API...")

    app.state.qdrant_svc = QdrantService(settings.QDRANT_URL, settings.QDRANT_API_KEY)
    app.state.embed_svc  = EmbedService(settings.FIREWORKS_API_KEY)

    print(f"Ready at http://{settings.HOST}:{settings.PORT}")
    yield

    await app.state.qdrant_svc.close()
    await app.state.embed_svc.close()


app = FastAPI(title="Halalify API", lifespan=lifespan)
manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── WebSocket /ws ─────────────────────────────────────────────────────────────
#
# CLIENT → SERVER  (incoming message types)
# ─────────────────────────────────────────────────────────────────────────────
# { "type": "message", "content": "is kit kat halal?" }       — chat query
# { "type": "barcode", "content": "8901234567890" }            — barcode / QR scan
# { "type": "image",   "image": "<base64>", "prompt": "..." }  — product image (prompt optional)
#
# SERVER → CLIENT  (outgoing event types)
# ─────────────────────────────────────────────────────────────────────────────
# { "type": "thinking",  "content": "Searching database..." }
# { "type": "tool_call", "tool": "semantic_search", "args": {...} }
# { "type": "token",     "content": "Kit Kat is..." }           — streamed response chunks
# { "type": "products",  "products": [...], "summary": {...}, "web_results": "..." }
# { "type": "done" }
# { "type": "error",     "content": "...", "code": "EMPTY_QUERY" }
#
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            try:
                data = await ws.receive_json()
            except Exception:
                await ws.send_json({
                    "type": "error",
                    "content": "Malformed message",
                    "code": "INVALID_MESSAGE",
                })
                continue

            await handle_ws_message(
                ws,
                data,
                app.state.qdrant_svc,
                app.state.embed_svc,
            )
    except WebSocketDisconnect:
        manager.disconnect(ws)


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
