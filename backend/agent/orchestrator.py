from __future__ import annotations

import json
from typing import AsyncIterator, List, Optional

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from agent.tools.websearch_tool import web_search as _web_search
from config import COLLECTION_PRODUCTS, SCORE_THRESHOLD, get_settings
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from utils.category import get_cert_bodies as _get_cert_bodies
from datetime import datetime
import logging
from prompts.general_guidelines_prompt import general_prompt

# set up a logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# initialize variables at module level
SEMANTIC_POOL = 10
settings = get_settings()

VECTOR_NAME   = "halal_product_dense_vector"
Checkpointer = MemorySaver()

if not settings.FIREWORKS_API_KEY:
    raise ValueError("Couldn't initialize FIREWORKS_API_KEY!")

if not settings.QDRANT_API_KEY or not settings.QDRANT_URL:
    raise ValueError("QDRANT credentials not defined!")

embed_svc = EmbedService(settings.FIREWORKS_API_KEY)
qdrant_svc = QdrantService(settings.QDRANT_URL, settings.QDRANT_API_KEY)

if not embed_svc:
    raise ValueError("Embedding model not configured")
if not qdrant_svc:
    raise ValueError("Qdrant collection not configured")


# ── Tool 1: Semantic search ───────────────────────────────────────────────
@tool
async def semantic_search(text: str) -> str:
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
    points = response.points if response.points else []
    for point in points:
        payload = point.payload
        pool.append(payload)

        
    [print(f"canonical_id: {payload.get('canonical_id')}, norm_name: {payload.get('norm_name')}") for payload in pool]
    return pool


class FilterArgs(BaseModel):
    norm_name:    Optional[str] = None
    category_l1:  Optional[str] = None
    category_l2:  Optional[str] = None
    halal_status: Optional[str] = None
    sold_in:      Optional[List[str]] = None
    marketplace:  Optional[List[str]] = None
    companies:    Optional[List[str]] = None
    cert_bodies:  Optional[List[str]] = None
    health_info:  Optional[List[str]] = None
    barcodes:     Optional[List[str]] = None
    typical_uses:    Optional[List[str]] = None
    fda_numbers:     Optional[List[str]] = None
    company_contact: Optional[List[str]] = None
    cert_expiry:     Optional[str]       = None   
    cert_issue:      Optional[str]       = None   
# ── Tool 2: Filter semantic results ──────────────────────────────────────
@tool
def filter_semantic_results(
    pool: List[dict],
    filter_args: FilterArgs,
) -> dict:
    """
    Filter the semantic search pool using values SEEN in the pool data.
    Derive all filter values from ACTUAL VALUES in the pool — not raw user text.
    Returns JSON: {"success": bool, "filtered_products": [...], "error": string}
    If filtered_products is empty, no exact matches found — call web_search as the next step.

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
        typical_uses:       use-case tags EXACTLY as seen in pool e.g. ['Moisturizer', 'Toner']
        fda_numbers:        FDA registration numbers EXACTLY as seen in pool
        company_contact:    contact strings EXACTLY as seen in pool e.g. ['info@nseproducts.com']
        cert_expiry:        exact expiry date string to match e.g. '2025-12-31'
        cert_issue:         exact issue date string to match e.g. '2023-01-01'
        
    """
    print("Filter tool called")
    print("cert bodies", filter_args.cert_bodies)
    if not pool:
        logger.info("No points present, can't filter!")
        return {
            "success": False,
            "filtered_products": [],
            "error": "No products for filtering"
        }
    active_filters = {k:v for k,v in filter_args.model_dump().items() if v is not None}

    filtered = []
    for p in pool:

        if p.get("cert_expiry"):
            parsed_expiry_date = parse_date(p["cert_expiry"])
            # get current date time
            # filter out expired products
            if parsed_expiry_date and parsed_expiry_date < datetime.now():
                continue

        match = True
        for k,v in active_filters.items():
            p_value = p.get(k)

            if isinstance(v, list):
                if not p_value or not set(v).issubset(set(p_value)):
                    match = False
                    break
            else:
                if p_value != v:
                    match = False
                    break
        if match:
            filtered.append(p)

    logger.info(f"[FILTER] {len(filtered)}/{len(pool)} matched")

    if not filtered:
        logger.info("[FILTER] No matches found after filtering")
        return {
            "success": False,
            "filtered_products": [],
            "error": "No match found after filtering"
        }
    
    # filtering successfull, return the results
    return {
        "success": True,
        "filtered_products": filtered,
        "error": ""
    }

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
    results =  await _web_search(query)
    return {
        "success": True,
        "web_results": results,
        "error": ""
    }


PERSONALITY_CAPABILITIES_PROMPT = """
You are Halalify Assistant AI, a friendly and knowledgeable, conversational halal product verification assistant built over a Halal verification platform named HALALIFY. 

HALALIFY's CAPABILITIES:
- Retrieve product information from a verified database of 2 million+ records.
- Help in verifying the halal status of a product. This includes HALAL, MASHBOOH or HARAM checks.
- Can take in QR Codes and product images through the user interface, process them and verify their Halal status.
- Perform a hybrid search. Products are first searched in the native, certified halal database of 2 million+ products. If no match is found for the desired product, then a web search is performed to determine the halal status of the product.

\n\n
"""

GUIDELINES_PROMPT = general_prompt



def parse_date(s: str) -> datetime | None:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None



async def run_agent(
    user_query: str,
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

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )

    agent = create_agent(
        name="HalalifySearchAgent",
        model=llm,
        tools=[semantic_search, filter_semantic_results, get_cert_body_for_country, web_search],
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
                        collected_products = data.get("filtered_products", [])
                        print(f"[FILTER_END] {len(collected_products)} products collected")
                    except Exception as e:
                        print(f"[FILTER_END] parse error: {e} — raw: {output_str[:120]}")
                elif name == "web_search":
                    try:
                        data = json.loads(output_str)
                        collected_web_results = data.get("web_results", [])
                        print(f"[WEB SEARCH END] {len(collected_web_results)} products collected")

                    except Exception as e:
                        print(f"[WEB SEARCH END] parse error: {e} - raw {output_str[:120]}")
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