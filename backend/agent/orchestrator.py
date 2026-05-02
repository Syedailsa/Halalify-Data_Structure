from __future__ import annotations

import json
from typing import AsyncIterator, List, Optional

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq

from agent.tools.websearch_tool import web_search as _web_search
from config import COLLECTION_PRODUCTS, SCORE_THRESHOLD, get_settings
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService

SEMANTIC_POOL = 10
VECTOR_NAME   = "halal_product_dense_vector"

SYSTEM_PROMPT = """You are Halalify AI, a friendly and knowledgeable halal product verification assistant.
You have access to tools to search a verified halal product database with thousands of certified products.

## MANDATORY FLOW FOR PRODUCT QUERIES

Step 1 → call semantic_search(text=user_query)
         Returns a JSON pool of real products from the verified database.

Step 2 → READ the pool carefully, then call filter_semantic_results with:
         - pool: the exact JSON string returned by semantic_search
         - user_query: the original user query
         - filters derived ONLY from ACTUAL VALUES you see in the pool — not raw user text

Step 3 → If filter_semantic_results returns fallback=True or count=0:
         call web_search(query=user_query) as a last resort.
         NEVER call web_search before completing Steps 1 and 2.

## FILTER DERIVATION RULES (Step 2)
- Use values EXACTLY as they appear in the pool — this avoids user misspelling/casing issues
- "is kat kit halal?" + pool has norm_name="Kit Kat"      → use norm_name="Kit Kat"
- "nestle products"  + pool has companies=["Nestle S.A."] → use companies=["Nestle S.A."]
- "is X halal?"      → halal_status="Halal" (from user intent) + norm_name from pool
- Only set filters relevant to the user's intent — leave all others unset

## WHEN NOT TO USE TOOLS
- Greetings (hi, hello, thanks, bye) → respond directly
- Help requests (what can you do) → explain capabilities directly
- General conversation → respond directly

## BARCODE / QR CODE SCANS
- Queries phrased as "is <code> halal?" come from barcode or QR code scans
- If the value is clearly not a consumer product (system code, URL, ticket ID, document ref)
  → respond warmly that it is outside the scope of halal verification, suggest scanning
    a product barcode printed on packaging instead
- If it could plausibly be a product or brand → proceed with semantic_search normally
- Never map a barcode to a random unrelated product — only report confirmed matches

## RESPONSE GUIDELINES
- Be warm, conversational, and helpful
- State halal / haram / mushbooh status clearly upfront
- Explain Mushbooh (doubtful — depends on source) if relevant
- Flag expired certifications gently
- Keep responses concise but complete
- NEVER fabricate product data — only use what tools return
- If filter_semantic_results returns fallback=True → mention exact match wasn't found
  but show similar results from the database
- If web_search also returns nothing → tell the user honestly and suggest checking
  with the manufacturer or a halal certification body directly
"""


async def run_agent(
    user_query: str,
    embed_svc: EmbedService,
    qdrant_svc: QdrantService,
) -> AsyncIterator[dict]:
    """
    Runs the Halalify agent. Yields dicts:
      {"type": "thinking",    "content": "..."}
      {"type": "tool_call",   "tool": "...", "args": {...}}
      {"type": "token",       "content": "..."}
      {"type": "tool_result", "products": [...], "summary": None, "web_results": "..."}
      {"type": "done"}
    """
    settings = get_settings()

    # ── Tool 1: Semantic search ───────────────────────────────────────────────
    @tool
    async def semantic_search(text: str) -> str:
        """
        Embed the query and fetch the top matching products from the halal database.
        Returns a JSON string pool of products. ALWAYS call this first for any product query.
        """
        print(f"[SEMANTIC] Embedding: '{text}'")
        try:
            vector = await embed_svc.embed(text)
        except Exception as e:
            print(f"[SEMANTIC] Embedding failed: {e}")
            return json.dumps([])

        try:
            response = await qdrant_svc.client.query_points(
                collection_name=COLLECTION_PRODUCTS,
                query=vector,
                using=VECTOR_NAME,
                with_vectors=False,
                limit=SEMANTIC_POOL,
                score_threshold=SCORE_THRESHOLD,
            )
            print(f"[SEMANTIC] {len(response.points)} results above threshold {SCORE_THRESHOLD}")
        except Exception as e:
            print(f"[SEMANTIC] Qdrant error: {e}")
            return json.dumps([])

        pool = []
        for point in response.points:
            p = point.payload or {}
            pool.append({
                "score":           round(point.score, 4),
                "canonical_id":    p.get("canonical_id"),
                "norm_name":       p.get("norm_name"),
                "halal_status":    p.get("halal_status"),
                "companies":       p.get("companies"),
                "category_l1":     p.get("category_l1"),
                "category_l2":     p.get("category_l2"),
                "sold_in":         p.get("sold_in"),
                "marketplace":     p.get("marketplace"),
                "cert_bodies":     p.get("cert_bodies"),
                "cert_expiry":     p.get("cert_expiry"),
                "cert_issue":      p.get("cert_issue"),
                "source_count":    p.get("source_count"),
                "health_info":     p.get("health_info"),
                "typical_uses":    p.get("typical_uses"),
                "source_ids":      p.get("source_ids"),
                "source_files":    p.get("source_files"),
                "fda_numbers":     p.get("fda_numbers"),
                "barcodes":        p.get("barcodes"),
                "company_contact": p.get("company_contact"),
            })

        for i, item in enumerate(pool, 1):
            print(f"  {i}. [{item['score']}] {item['norm_name']} | {item['halal_status']}")

        return json.dumps(pool)

    # ── Tool 2: Filter semantic results ──────────────────────────────────────
    @tool
    def filter_semantic_results(
        pool:         str,
        user_query:   str,
        norm_name:    Optional[str]       = None,
        category_l1:  Optional[str]       = None,
        category_l2:  Optional[str]       = None,
        halal_status: Optional[str]       = None,
        sold_in:      Optional[List[str]] = None,
        marketplace:  Optional[List[str]] = None,
        companies:    Optional[List[str]] = None,
        cert_bodies:  Optional[List[str]] = None,
        health_info:  Optional[List[str]] = None,
        barcodes:     Optional[List[str]] = None,
    ) -> str:
        """
        Filter the semantic search pool using values SEEN in the pool data.
        Derive all filter values from ACTUAL VALUES in the pool — not raw user text.
        Returns JSON: {"results": [...], "count": N, "fallback": bool}
        If fallback=True, no exact matches found — call web_search as the next step.

        Args:
            pool:         JSON string from semantic_search
            user_query:   original user query for context
            norm_name:    product name EXACTLY as seen in pool e.g. 'Kit Kat'
            category_l1:  category EXACTLY as seen in pool e.g. 'Food'
            category_l2:  sub-category EXACTLY as seen in pool e.g. 'Snacks & Confectionery'
            halal_status: status EXACTLY as seen in pool e.g. 'Halal', 'Haraam', 'Mushbooh'
            sold_in:      regions EXACTLY as seen in pool e.g. ['Singapore']
            marketplace:  marketplace EXACTLY as seen in pool e.g. ['Retail']
            companies:    company names EXACTLY as seen in pool e.g. ['Nestle S.A.']
            cert_bodies:  cert bodies EXACTLY as seen in pool e.g. ['IFANCA']
            health_info:  health tags EXACTLY as seen in pool
            barcodes:     barcodes EXACTLY as seen in pool
        """
        print(f"[FILTER] query={user_query!r} norm_name={norm_name} "
              f"halal_status={halal_status} companies={companies}")

        try:
            products = json.loads(pool)
        except Exception as e:
            return json.dumps({"error": f"Failed to parse pool: {e}"})

        filtered = []
        for p in products:
            match = True

            if norm_name:
                db_val = (p.get("norm_name") or "").lower()
                if norm_name.lower() not in db_val:
                    match = False

            if halal_status:
                db_val = (p.get("halal_status") or "").lower()
                if halal_status.lower() not in db_val:
                    match = False

            if category_l1:
                db_val = (p.get("category_l1") or "").lower()
                if category_l1.lower() not in db_val:
                    match = False

            if category_l2:
                db_val = (p.get("category_l2") or "").lower()
                if category_l2.lower() not in db_val:
                    match = False

            if companies:
                db_val = " ".join(p.get("companies") or []).lower()
                if not any(c.lower() in db_val for c in companies):
                    match = False

            if sold_in:
                db_val = " ".join(p.get("sold_in") or []).lower()
                if not any(s.lower() in db_val for s in sold_in):
                    match = False

            if cert_bodies:
                db_val = " ".join(p.get("cert_bodies") or []).lower()
                if not any(c.lower() in db_val for c in cert_bodies):
                    match = False

            if marketplace:
                db_val = " ".join(p.get("marketplace") or []).lower()
                if not any(m.lower() in db_val for m in marketplace):
                    match = False

            if health_info:
                db_val = " ".join(p.get("health_info") or []).lower()
                if not any(h.lower() in db_val for h in health_info):
                    match = False

            if barcodes:
                db_val = " ".join(p.get("barcodes") or []).lower()
                if not any(b.lower() in db_val for b in barcodes):
                    match = False

            if match:
                filtered.append(p)

        print(f"[FILTER] {len(filtered)}/{len(products)} matched")

        if not filtered:
            print("[FILTER] No matches — fallback to full pool")
            return json.dumps({
                "results": products,
                "count":   len(products),
                "fallback": True,
                "message": "Filters returned no results, showing semantic results instead.",
            })

        return json.dumps({"results": filtered, "count": len(filtered), "fallback": False})

    # ── Tool 3: Web search (last resort) ─────────────────────────────────────
    @tool
    async def web_search(query: str) -> str:
        """
        Search the web for halal certification information.
        LAST RESORT ONLY — call this only after filter_semantic_results returns
        fallback=True or count=0. NEVER call this as your first tool.
        """
        return await _web_search(query)

    # ── Build agent (same pattern as test_filters.py) ─────────────────────────
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=settings.GROQ_API_KEY,
        temperature=0.3,
    )

    agent = create_agent(
        name="HalalifySearchAgent",
        model=llm,
        tools=[semantic_search, filter_semantic_results, web_search],
        system_prompt=SYSTEM_PROMPT,
    )

    # ── Stream events ─────────────────────────────────────────────────────────
    collected_products: list[dict] = []
    collected_web_results: str | None = None

    yield {"type": "thinking", "content": "Thinking..."}

    try:
        async for event in agent.astream_events(
            {"messages": [HumanMessage(content=user_query)]},
            version="v2",
        ):
            kind = event["event"]
            name = event.get("name", "")

            if kind == "on_tool_start":
                args = event["data"].get("input", {})
                # Suppress pool JSON from display — too verbose
                display_args = {
                    k: v for k, v in (args or {}).items()
                    if k != "pool" and v is not None
                }
                print(f"[AGENT] Tool call: {name}({display_args})")
                yield {"type": "tool_call", "tool": name, "args": display_args}

            elif kind == "on_tool_end":
                raw_output = event["data"].get("output", "")
                # LangGraph wraps tool output in a ToolMessage — unwrap to get the content string
                if isinstance(raw_output, str):
                    output_str = raw_output
                elif hasattr(raw_output, "content"):
                    output_str = raw_output.content
                else:
                    output_str = str(raw_output)

                if name == "filter_semantic_results":
                    try:
                        data = json.loads(output_str)
                        collected_products = data.get("results", [])
                        print(f"[FILTER_END] {len(collected_products)} products collected")
                    except Exception as e:
                        print(f"[FILTER_END] parse error: {e} — raw: {output_str[:120]}")
                elif name == "web_search":
                    collected_web_results = output_str

            elif kind == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                # Only yield content tokens, not tool-routing chunks
                if chunk and chunk.content and not getattr(chunk, "tool_call_chunks", None):
                    yield {"type": "token", "content": chunk.content}

    except Exception:
        import traceback
        traceback.print_exc()
        yield {
            "type": "token",
            "content": "Sorry, I had trouble processing your request. Please try rephrasing.",
        }
        yield {"type": "done"}
        return

    print(f"[AGENT] Stream done — collected_products={len(collected_products)} web_results={bool(collected_web_results)}")
    if collected_products or collected_web_results:
        print(f"[AGENT] Yielding tool_result with {len(collected_products)} products")
        yield {
            "type": "tool_result",
            "products": collected_products,
            "summary":  None,
            "web_results": collected_web_results,
        }

    yield {"type": "done"}
