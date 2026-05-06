from __future__ import annotations

import json
from typing import AsyncIterator, List, Optional

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver

from agent.tools.websearch_tool import web_search as _web_search
from config import COLLECTION_PRODUCTS, SCORE_THRESHOLD, get_settings
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from utils.category import get_cert_bodies as _get_cert_bodies

# initialize variables at module level
SEMANTIC_POOL = 10
settings = get_settings()

VECTOR_NAME   = "halal_product_dense_vector"
Checkpointer = MemorySaver()

PERSONALITY_CAPABILITIES_PROMPT = """
You are Halalify Assistant AI, a friendly and knowledgeable, conversational halal product verification assistant built over a Halal verification platform named HALALIFY. 

HALALIFY's CAPABILITIES:
- Retrieve product information from a verified database of 2 million+ records.
- Help in verifying the halal status of a product. This includes HALAL, MASHBOOH or HARAM checks.
- Can take in QR Codes and product images through the user interface, process them and verify their Halal status.
- Perform a hybrid search. Products are first searched in the native, certified halal database of 2 million+ products. If no match is found for the desired product, then a web search is performed to determine the halal status of the product.

\n\n
"""

GUIDELINES_PROMPT = """
You have access to tools to search a verified halal product database with millions of certified products.

## MANDATORY FLOW FOR PRODUCT QUERIES

Step 1 → call semantic_search(text=user_query)
Returns a JSON pool of real products from the verified database.

Step 2 → If `semantic_search` tool returns empty results or an empty pool:
        - recall `semantic_search` tool and this adjust the query parameter or paraphrase it. It can help get relevant results.
        - You can call `semantic_search` tool up to 4 times total (including the first call), but STOP immediately once you get valid results.
        
Step 2 → READ the pool carefully, if the pool is not empty then always call filter_semantic_results with:
        - pool: the exact JSON string returned by semantic_search
        - filters derived ONLY from ACTUAL VALUES you see in the pool — not raw user text

Step 2.5 → (optional) If the user mentions a country DIFFERENT from their detected location:
        a. call get_cert_body_for_country(country) → get that country's cert bodies
        b. Re-call semantic_search(text=original_query, cert_body_hint=<first cert body from result>)
            so the embedding is enriched for the correct country, not the user's home location
        c. Use this new pool (not the first one) for filter_semantic_results

Step 3 → If filter_semantic_results returns fallback=True or count=0 or even if the `semantic_search` didn't returned any relevant results after a max retry of 4 times, then:
        - call web_search(query=user_query) as a last resort.
        - NEVER call web_search before completing the above steps.

## FILTER DERIVATION RULES

### The Single Rule (applies to ALL filter parameters)

For ANY filter parameter (`norm_name`, `companies`, `category_l1`, `category_l2`, `halal_status`, `sold_in`, `marketplace`, `cert_bodies`, `health_info`, `barcodes`):

**Step 1 — Does the user explicitly or implicitly ask for this filter?**

- **Explicit:** "is Kit Kat halal?" → `norm_name`, `halal_status`
- **Explicit:** "products by Nestle" → `companies`
- **Implicit:** location context → `sold_in`, `cert_bodies`
- **Implicit:** "halal snacks" → `halal_status`, `category_l2`

**NO** → leave parameter as `None`

**Step 2 — YES → Can you find a matching/similar value in the pool for this parameter?**

| Scenario | Action | Example |
|----------|--------|---------|
| **YES, match exists in pool** | Use the EXACT string from the pool | `"kit kat"` + pool has `"Kit Kat"` → `norm_name="Kit Kat"`<br>`"nestle"` + pool has `"Nestle S.A."` → `companies=["Nestle S.A."]`<br>`"singapore"` + pool has `"Singapore"` → `sold_in=["Singapore"]`<br>`"ifanca"` + pool has `"IFANCA"` → `cert_bodies=["IFANCA"]` |
| **NO match in pool, but user explicitly mentioned this parameter** | Use the user's term as-is | `"is Hajmola halal?"` + pool has NO `"Hajmola"` → `norm_name="Hajmola"`<br>`"certified by ABC Body"` + pool has NO `"ABC Body"` → `cert_bodies=["ABC Body"]`<br>`"sold in Mars"` + pool has NO `"Mars"` → `sold_in=["Mars"]` |

**Why this matters:** Using user term when no pool match exists will return 0 results → triggers `fallback=True` → agent knows to call `web_search`

---

### Decision Table

| User says | Parameter | Match in pool? | Action |
|-----------|-----------|----------------|--------|
| `"Kit Kat"` | `norm_name` | YES → `"Kit Kat"` | Use pool value |
| `"kit kat"` | `norm_name` | YES → `"Kit Kat"` | Use pool value |
| `"Hajmola"` | `norm_name` | NO | Use `"Hajmola"` (user term) |
| `"Nestle"` | `companies` | YES → `"Nestle S.A."` | Use pool value |
| `"Unknown Brand"` | `companies` | NO | Use `"Unknown Brand"` (user term) |
| `"Singapore"` | `sold_in` | YES → `"Singapore"` | Use pool value |
| `"Mars planet"` | `sold_in` | NO | Use `"Mars planet"` (user term) |
| `"halal"` | `halal_status` | YES → `"Halal"` | Use pool value |
| `"haram"` | `halal_status` | YES → `"Haraam"` | Use pool value |

---

### One-line Summary

> For any filter parameter: if user asks for it → find closest match in pool and use that EXACT value; if no match exists but user explicitly specified it → use user's term as-is; otherwise leave `None`.
## WHEN NOT TO USE TOOLS
- Greetings (hi, hello, thanks, bye) → respond directly
- Help requests (what can you do?) → explain capabilities directly
- General conversation → respond directly

## BARCODE / QR CODE SCANS
- Queries phrased as "is <code> halal?" come from barcode or QR code scans
- If the value is clearly not a consumer product (system code, URL, ticket ID, document ref)
→ respond warmly that it is outside the scope of halal verification and suggest
scanning a product barcode printed on packaging instead
- If it could plausibly be a product or brand → proceed with semantic_search normally
- Never map a barcode to a random unrelated product — only report confirmed matches

## RESPONSE GUIDELINES
- Be warm, conversational, and helpful
- State halal / haram / mushbooh status clearly upfront
- Explain Mushbooh (doubtful — depends on source) if relevant
- Flag expired certifications gently
- Keep responses concise but complete and comprehensive
- NEVER fabricate, hallucinate, modify or alter product data — only use what tools return
- If filter_semantic_results returns fallback=True → call the web_search tool to try to find any relevant information from the web, using the original user query as the search query
- If web_search also returns nothing → tell the user honestly and suggest checking the product with the manufacturer or a halal certification body directly
"""


async def run_agent(
    user_query: str,
    embed_svc: EmbedService,
    qdrant_svc: QdrantService,
    country: str | None = None,
    cert_bodies: List[str] | None = None,
    thread_id: str = "default"
) -> AsyncIterator[dict]:
    """
    Runs the Halalify agent. Yields dicts:
      {"type": "thinking",    "content": "..."}
      {"type": "tool_call",   "tool": "...", "args": {...}}
      {"type": "token",       "content": "..."}
      {"type": "tool_result", "products": [...], "summary": None, "web_results": "..."}
      {"type": "done"}
    """
    _cert_bodies: List[str] = cert_bodies or []

    # ── Build dynamic location context block ─────────────────────────────────
    location_block = ""
    if country:
        location_block = f"""The user is located in
        **{country}**.\n\n"""
        if _cert_bodies:
            bodies_str = ", ".join(f'"{b}"' for b in _cert_bodies)
            location_block += f"""
            ## USER LOCATION CONTEXT
            Known halal certification authorities for {country}: {bodies_str}.

            ## LOCATION FILTERING RULES

            - When you call `semantic_search`, the query is automatically enriched with the user's location certification bodies — results will lean toward `{country}`-certified products.

            - After receiving `semantic_results` from the `semantic_search` tool, examine the actual `cert_bodies` values in each result.

            - **Apply location cert bodies as filters by default** — unless the user explicitly says not to (e.g., "show me Kit Kat even if not Singapore-certified").

            - Identify values that match or are similar in spelling to the location's certification bodies. Account for case differences, abbreviations, and slight name variations.

            - **If matching/similar cert bodies exist in the pool** → Use those EXACT string matches from `semantic_results` when calling `filter_semantic_results`.

            - **If NO matching/similar cert bodies exist in the pool** (even after accounting for variations), but the user's location is known → Apply the location's expected certification bodies as-is to `cert_bodies` when calling `filter_semantic_results`. This will return 0 results → triggers `fallback=True` → proceed to `web_search`.

            - If the user explicitly mentions a specific cert authority in their query, add it to the `cert_bodies` list in `filter_semantic_results` — apply BOTH the location cert bodies AND the user-mentioned one.

            - If no results are returned by the `filter_semantic_results` tool, handle these two cases:
                - **Product exists** in `semantic_results` but its `cert_body` is NOT in the allowed list → Notify the user the product isn't certified by their location's body. Offer to show products with other cert bodies.
                - **Product not found** in `semantic_results` → Notify the user honestly that no match was found.

            - Always acknowledge the user's country/location in your response when relevant.


            DIFFERENT COUNTRY IN QUERY:
            - If the user's query references a country different from {country}:
            1. Call get_cert_body_for_country(that_country) → returns a cert_bodies list
            2. Re-call semantic_search with cert_body_hint set to that list so the vector search is enriched for the correct country, not {country}
            3. Use the new pool for `filter_semantic_results` tool with these cert_bodies list.
            \n\n
            """

    effective_system_prompt = PERSONALITY_CAPABILITIES_PROMPT + location_block + GUIDELINES_PROMPT

    # ── Tool 1: Semantic search ───────────────────────────────────────────────
    @tool
    async def semantic_search(text: str, cert_body_hint: Optional[List[str]] = None) -> str:
        """
        Embed the query and fetch the top matching products from the halal database.
        Returns a JSON string pool of products. ALWAYS call this first for any product query.

        cert_body_hint: pass this when the user is asking about a country DIFFERENT from their detected location. Supply the cert body string returned by
        get_cert_body_for_country so the embedding is enriched correctly
        for that country instead of the user's home location.
        Leave empty for normal location-scoped searches.
        """
        # Use the hint when provided (different-country query), otherwise fall back
        # to the session location cert bodies.
        print("enrich_with" , cert_body_hint)
        if cert_body_hint:
            enrich_with = cert_body_hint
        else:
            enrich_with = _cert_bodies

        search_text = f"{text} {' '.join(enrich_with)}" if enrich_with else text

        print(f"[SEMANTIC] Embedding: '{search_text}'")
        try:
            vector = await embed_svc.embed(search_text)
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
        print("Filter tool called")
        print("cert bodies", cert_bodies)
        try:
            products = json.loads(pool) if pool else []
        except Exception as e:
            return json.dumps({"results": [], "count": 0, "fallback": True,
            "message": "Pool data was missing or malformed."})

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

            # enforce cert_bodies if location is enabled and cert_bodies args is None/Empty List        
            # active_cert_bodies = cert_bodies or _cert_bodies
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
                "results": [],
                "count": 0,
                "fallback": True,
                "message": "Filters returned no results, showing semantic results instead.",
            })

        return json.dumps({
            "results": filtered,
            "count": len(filtered),
            "fallback": False
        })

    # ── Tool 3: Cert body lookup by country ──────────────────────────────────
    @tool
    def get_cert_body_for_country(country: str) -> str:
        """
        Return the halal certification authorities for a given country as a JSON list.
        Call this when the user mentions a specific country or region in their query
        that differs from their detected location, so you can scope filtering correctly.
        """
        bodies = _get_cert_bodies(country.strip())
        print(f"[CERT_LOOKUP] country={country!r} → {bodies}")
        if not bodies:
            return json.dumps({"country": country, "cert_bodies": [], "note": f"No known cert authority for {country}"})
        return json.dumps({"country": country, "cert_bodies": bodies})

    # ── Tool 4: Web search (last resort) ─────────────────────────────────────
    @tool
    async def web_search(query: str) -> str:
        """
        Search the web for halal certification information.
        LAST RESORT ONLY — call this only after filter_semantic_results returns
        fallback=True or count=0. NEVER call this as your first tool.
        Returns a JSON array of {index, title, url, snippet} objects.
        After reviewing the results, call surface_web_results with the relevant indices.
        """
        return await _web_search(query)

    # ── Tool 5: Surface curated web results ───────────────────────────────────
    _web_pool: list[dict] = []

    @tool
    def surface_web_results(indices: List[int]) -> str:
        """
        After reviewing web_search results, call this with the indices of results
        that are genuinely relevant to the user's halal question.
        Pass an empty list if none are relevant.
        """
        selected = [_web_pool[i] for i in indices if i < len(_web_pool)]
        print(f"[SURFACE] {len(selected)}/{len(_web_pool)} results surfaced (indices={indices})")
        return json.dumps(selected)

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )

    agent = create_agent(
        name="HalalifySearchAgent",
        model=llm,
        tools=[semantic_search, filter_semantic_results, get_cert_body_for_country, web_search, surface_web_results],
        system_prompt=effective_system_prompt,
        checkpointer=Checkpointer,
    )

    run_config = {"configurable": {"thread_id": thread_id}}

    # ── Stream events ─────────────────────────────────────────────────────────
    collected_products: list[dict] = []
    collected_web_results: str | None = None

    yield {"type": "thinking", "content": "Thinking..."}

    try:
        async for event in agent.astream_events(
            {"messages": [HumanMessage(content=user_query)]},
            version="v2",
            config=run_config,
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
                        if data.get("fallback"):
                            collected_products = []
                        else:
                            collected_products = data.get("results", [])
                        print(f"[FILTER_END] {len(collected_products)} products collected")
                    except Exception as e:
                        print(f"[FILTER_END] parse error: {e} — raw: {output_str[:120]}")
                elif name == "web_search":
                    try:
                        pool = json.loads(output_str)
                        if isinstance(pool, list):
                            _web_pool.clear()
                            _web_pool.extend(pool)
                    except Exception:
                        pass
                elif name == "surface_web_results":
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