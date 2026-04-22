from __future__ import annotations

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.orchestrator import run_agent
from agent.tools.websearch_tool import web_search
from config import get_settings
from data.category_map import CANONICAL_CATEGORIES, resolve_category
from services.company_store import CompanyStore
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from websocket.handler import handle_ws_message
from websocket.manager import ConnectionManager


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print("Starting Halal Product API Server...")

    # Company store
    store = CompanyStore()
    loaded = store.load(settings.PRODUCTS_PATH)
    if not loaded:
        print("Failed to load company list. Server may not function properly.", file=sys.stderr)
    else:
        print(f"Loaded {len(store.companies)} companies")

    # Services
    qdrant_svc = QdrantService(settings.QDRANT_URL, settings.QDRANT_API_KEY)
    embed_svc = EmbedService(settings.FIREWORKS_API_KEY)

    app.state.company_store = store
    app.state.qdrant_svc = qdrant_svc
    app.state.embed_svc = embed_svc

    print(f"Server ready at http://{settings.HOST}:{settings.PORT}")
    yield

    # Cleanup
    await qdrant_svc.close()
    await embed_svc.close()


app = FastAPI(title="Halalify API", lifespan=lifespan)
manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket ────────────────────────────────────────────────────────────────
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
                app.state.company_store,
            )
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ── REST Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/halal")
async def health_check():
    store: CompanyStore = app.state.company_store
    return {
        "success": True,
        "status": "Halal",
        "initialized": store.is_initialized,
        "companiesLoaded": len(store.companies),
    }


@app.get("/api/companies")
async def list_companies(search: str | None = None):
    store: CompanyStore = app.state.company_store
    if not store.is_initialized:
        return {"success": False, "error": "Service not initialized. Please try again later."}

    companies = [c["raw"] for c in store.companies]
    if search:
        sl = search.lower()
        companies = [c for c in companies if sl in c.lower()]
    return {"success": True, "count": len(companies), "companies": sorted(companies)}


@app.get("/api/categories")
async def list_categories():
    return {"success": True, "categories": CANONICAL_CATEGORIES}


class QueryBody(BaseModel):
    query: str


@app.post("/api/query")
async def query_endpoint(body: QueryBody):
    q = body.query.strip()
    if not q:
        return {"success": False, "error": "Query is required"}

    try:
        tokens: list[str] = []
        products: list[dict] = []
        summary = None
        web_results = None
        tools_called: list[dict] = []

        async for event in run_agent(
            user_query=q,
            embed_svc=app.state.embed_svc,
            qdrant_svc=app.state.qdrant_svc,
            company_store=app.state.company_store,
        ):
            t = event.get("type")
            if t == "token":
                tokens.append(event.get("content", ""))
            elif t == "tool_result":
                new_products = event.get("products", [])
                if new_products:
                    products = new_products
                if event.get("summary"):
                    summary = event["summary"]
                if event.get("web_results"):
                    web_results = event["web_results"]
            elif t == "tool_call":
                tools_called.append({"tool": event.get("tool"), "args": event.get("args")})

        return {
            "success": True,
            "query": q,
            "response": "".join(tokens),
            "products": products[:8],
            "summary": summary,
            "webResults": web_results,
            "toolsCalled": tools_called,
            "found": len(products) > 0,
            "notInDatabase": web_results is not None and len(products) == 0,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "query": q}


@app.get("/api/search/company")
async def search_company(company: str, category: str | None = None):
    from agent.tools.company_tool import CompanyTool
    from schemas.query_schema import CompanyQuerySchema

    resolved_category = resolve_category(category) if category else None
    schema = CompanyQuerySchema(company=company, category=resolved_category)
    tool = CompanyTool()
    result = await tool.execute(
        schema,
        embed_svc=app.state.embed_svc,
        qdrant_svc=app.state.qdrant_svc,
        original_query=company,
    )
    return {
        "success": True,
        "query": {"company": company, "category": resolved_category},
        "results": [{"score": r["score"], "payload": r["payload"]} for r in result.results],
        "count": len(result.results),
    }


@app.get("/api/search/product")
async def search_product(product: str, category: str | None = None, company: str | None = None):
    from agent.tools.product_tool import ProductTool
    from schemas.query_schema import ProductQuerySchema

    resolved_category = resolve_category(category) if category else None
    schema = ProductQuerySchema(product=product, company=company, category=resolved_category)
    tool = ProductTool()
    result = await tool.execute(
        schema,
        embed_svc=app.state.embed_svc,
        qdrant_svc=app.state.qdrant_svc,
        resolved_company=company,
        original_query=product,
    )
    return {
        "success": True,
        "query": {"product": product, "category": resolved_category, "company": company},
        "results": [{"score": r["score"], "payload": r["payload"]} for r in result.results],
        "count": len(result.results),
    }


@app.get("/api/search/enumbers/{e_code}")
async def search_enumber(e_code: str):
    from agent.tools.enumber_tool import ENumberTool
    from schemas.query_schema import ENumberQuerySchema

    normalized = e_code.upper() if e_code.upper().startswith("E") else f"E{e_code.upper()}"
    schema = ENumberQuerySchema(e_code=normalized)
    tool = ENumberTool()
    result = await tool.execute(schema, qdrant_svc=app.state.qdrant_svc)
    return {
        "success": True,
        "query": {"eCode": normalized},
        "results": [{"score": r["score"], "payload": r["payload"]} for r in result.results],
        "count": len(result.results),
    }


@app.get("/api/search/category")
async def search_category(category: str, hint: str = ""):
    from agent.tools.category_tool import CategoryTool
    from schemas.query_schema import CategoryBrowseSchema

    schema = CategoryBrowseSchema(category=category, hint=hint)
    tool = CategoryTool()
    result = await tool.execute(schema, embed_svc=app.state.embed_svc, qdrant_svc=app.state.qdrant_svc)
    return {
        "success": True,
        "query": {"category": category, "hint": hint},
        "results": [{"score": r["score"], "payload": r["payload"]} for r in result.results],
        "count": len(result.results),
    }


@app.post("/api/websearch")
async def websearch_endpoint(body: QueryBody):
    q = body.query.strip()
    if not q:
        return {"success": False, "error": "Query is required"}
    try:
        results = await web_search(q)
        return {"success": True, "query": q, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/match/company")
async def match_company(company: str, threshold: float | None = None):
    store: CompanyStore = app.state.company_store
    if not store.is_initialized:
        return {"success": False, "error": "Service not initialized. Please try again later."}
    match = store.fuzzy_match(company, threshold) if threshold else store.fuzzy_match(company)
    return {"success": True, "query": {"company": company, "threshold": threshold}, "match": match}


@app.get("/api/resolve/category")
async def resolve_category_endpoint(category: str):
    resolved = resolve_category(category)
    return {"success": True, "query": {"category": category}, "resolved": resolved}


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
