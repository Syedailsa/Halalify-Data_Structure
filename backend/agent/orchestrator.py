from __future__ import annotations

import json
import re
from datetime import date
from typing import Any, AsyncIterator

PLACEHOLDER_VALUES = {
    "unknown", "unspecified", "none", "n/a", "na", "not specified",
    "not mentioned", "not provided", "halalify default", "default", "",
}

def sanitize_tool_args(args: dict) -> dict:
    """Remove optional fields that the LLM filled with placeholder values."""
    required_fields = {"product", "company", "e_code", "category", "query"}
    clean = {}
    for k, v in args.items():
        if isinstance(v, str) and v.lower().strip() in PLACEHOLDER_VALUES and k not in required_fields:
            continue
        clean[k] = v
    return clean

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq

from agent.tools.base_tool import get_adaptive_threshold
from agent.tools.category_tool import CategoryTool
from agent.tools.company_tool import CompanyTool
from agent.tools.enumber_tool import ENumberTool
from agent.tools.product_tool import ProductTool
from agent.tools.websearch_tool import web_search as _web_search
from config import get_settings
from data.category_map import resolve_category
from schemas.query_schema import (
    CategoryBrowseSchema,
    CompanyQuerySchema,
    ENumberQuerySchema,
    ProductQuerySchema,
)
from schemas.response_schema import ToolResult
from services.company_store import CompanyStore
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService

SYSTEM_PROMPT = """You are Halalify AI, a friendly and knowledgeable halal product verification assistant.
You have access to tools to search a verified halal product database with thousands of certified products.

WHEN TO USE TOOLS:
- User asks about a specific product (e.g. "is lays chips halal") → use search_product
- User asks about a company/brand (e.g. "tell me about nestle") → use search_company
- User asks about an E-number additive (e.g. "is E471 halal") → use search_enumber
- User wants to browse a category (e.g. "show me halal snacks") → use search_category
- If a database search returns no results or the product is not found (e.g. "show me halal beverages options in korea near seoul") → use web_search as fallback
- User asks a general halal question about an ingredient (e.g. "is gelatin halal") → use search_product

WHEN NOT TO USE TOOLS:
- Greetings (hi, hello, thanks, bye) → respond directly
- Help requests (what can you do, how does this work) → explain your capabilities directly
- General conversation → respond directly

CRITICAL RULES:
- ALWAYS split brand from product: "lays chips" → company="lays", product="chips"
- For company-only queries use search_company, for product queries use search_product
- If you're unsure whether something is a product or company, use search_product
- NEVER make up halal statuses or certifications — only report what the tools return
- If web_search returns actual results, share them and note they are from web sources
- If the user specifies a country or region (e.g. "in australia", "in the UK"),
  ALWAYS pass it as the `location` parameter in search_category or search_company.
  If the database results don't match that location, fall back to web_search.
- If a tool says "NOT found in the verified database" or "Web search unavailable", be honest — tell the user the product wasn't found in your database and web search couldn't help. Suggest they check with the manufacturer or a halal certification body.
- NEVER call web_search as your first tool. You MUST always call a database tool (search_product, search_company, search_category, or search_enumber) first. Only call web_search if the database tool's response explicitly says the product was NOT FOUND in the database.

RESPONSE GUIDELINES:
- Be warm, conversational, and helpful
- State halal/haram/mushbooh status clearly upfront
- Explain what Mushbooh means if relevant (doubtful — may or may not be halal depending on source)
- Flag expired certifications gently
- Keep responses concise but complete
- When products are NOT found, do NOT say "the search returned unreliable results" — just say you couldn't find it and offer helpful next steps"""

# ── Tool definitions for LangChain ───────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_product",
            "description": "Search the halal product database for a specific product. Use when the user asks about a particular food item, ingredient, or product. Split brand from product — pass brand as company, item as product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product": {"type": "string", "description": "The product name/type to search for (e.g. 'chips', 'chocolate spread', 'water')"},
                    "company": {"type": "string", "description": "The brand/manufacturer name if mentioned (e.g. 'lays', 'nestle', 'nutella'). Omit if not specified."},
                    "category": {"type": "string", "description": "Product category if obvious (e.g. 'food', 'beverage', 'cosmetic', 'pharma'). Omit if unsure."},
                    "location": {
                        "type": "string",
                        "description": "Country or region mentioned by user (e.g. 'australia', 'uk', 'malaysia'). Omit if not specified."
                    },
                },
                "required": ["product"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_company",
            "description": "Search for all products from a specific company/brand in the halal database. Use when the user asks about a brand overall, not a specific product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company": {"type": "string", "description": "The company/brand name to search for"},
                    "category": {"type": "string", "description": "Optional category filter (food, beverage, cosmetic, pharma)"},
                },
                "required": ["company"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_enumber",
            "description": "Look up an E-number food additive (e.g. E471, E330, E202) to check its halal status. Use when the user mentions an E-number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "e_code": {"type": "string", "description": "The E-number code (e.g. 'E471', 'E330')"},
                },
                "required": ["e_code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_category",
            "description": "Browse halal products by category. Use when the user wants to see products in a category like snacks, beverages, cosmetics, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "The category to browse (e.g. 'snacks', 'beverages', 'cosmetics', 'medicine')"},
                    "hint": {"type": "string", "description": "The user's original query for better search results"},
                    "location": {
                        "type": "string",
                        "description": "Country or region mentioned by user (e.g. 'australia', 'uk', 'malaysia'). Omit if not specified."
                    },
                },
                "required": ["category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for halal certification information. LAST RESORT ONLY — call this ONLY after a database tool (search_product, search_company, search_category, or search_enumber) has already returned no results. NEVER call this as your first tool.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query about halal status"},
                },
                "required": ["query"],
            },
        },
    },
]


# ── Tool execution ───────────────────────────────────────────────────────────

def _filter_products(
    tool_result: ToolResult,
    tool_name: str = "",
    tool_args: dict | None = None,
    location: str | None = None,
) -> list[dict]:
    """Apply adaptive threshold, name-relevance gate, and location gate."""
    if not tool_result.results:
        return []
    threshold = get_adaptive_threshold(tool_result.results)
    filtered = []
    for r in tool_result.results[:8]:
        p = r.get("payload", {})
        if r["score"] < threshold and r["score"] != 1.0:
            continue
        if (p.get("norm_name") or "").lower() == "n/a":
            continue
        filtered.append(p)

    # Location gate
    if location and filtered:
        location_lower = location.lower().strip()
        location_filtered = [
            p for p in filtered
            if _product_matches_location(p, location_lower)
        ]
        if not location_filtered:
            return []  # caller will fallback to web search
        filtered = location_filtered

    # Name-relevance gate — for search_product and search_company.
    # When a company/brand is specified, require at least one company keyword to appear
    # in each result's name or companies field. This catches cases where Qdrant returns
    # semantically similar but wrong-brand results (e.g. searching "bisconni novita"
    # returning unrelated biscuit brands).
    # When NO company is specified, skip this gate entirely — product keyword terms
    # like "chocolate" or "bars" rarely appear verbatim in norm_names (e.g. "Twix Caramel"
    # doesn't contain "chocolate"), so the gate causes false web-search fallbacks.
    # Vector similarity already ranks results; trust it for generic product queries.
    if tool_name in ("search_product", "search_company") and tool_args and filtered:
        company_val = tool_args.get("company") or ""
        company_kws = {
            w for w in re.sub(r"[^a-z0-9\s]", "", company_val.lower()).split()
            if len(w) > 2
        }

        if company_kws:
            def _matches(p: dict) -> bool:
                name = re.sub(r"[^a-z0-9\s]", "", (p.get("norm_name") or "").lower())
                comps = " ".join(c.lower() for c in (p.get("companies") or []))
                comps = re.sub(r"[^a-z0-9\s]", "", comps)
                text = f"{name} {comps}"
                return any(w in text for w in company_kws)

            relevant = [p for p in filtered if _matches(p)]
            if relevant:
                filtered = relevant
            else:
                return []  # brand not found in database → caller falls back to web search

    return filtered


def _product_matches_location(p: dict, location: str) -> bool:
    """Check if product payload matches a location. Adapt field names to your schema."""
    sold_in = p.get("sold_in") or []
    if isinstance(sold_in, str):
        sold_in = [sold_in]
    
    searchable = " ".join([
        " ".join(sold_in),
        " ".join(p.get("cert_bodies") or []),
        (p.get("norm_name") or ""),
    ]).lower()
    return location in searchable


def _format_tool_result(tool_result: ToolResult) -> str:
    """Format a ToolResult into a string for the LLM to read."""
    parts = []
    product_lines = []

    if tool_result.summary:
        s = tool_result.summary
        parts.append(f"Company: {s['company']} — {s['halal']} Halal, {s['haram']} Haraam, {s['mushbooh']} Mushbooh products found.")

    if tool_result.results:
        today = date.today().isoformat()
        threshold = get_adaptive_threshold(tool_result.results)
        for r in tool_result.results[:8]:
            p = r.get("payload", {})
            if r["score"] < threshold and r["score"] != 1.0:
                continue
            if (p.get("norm_name") or "").lower() == "n/a":
                continue
            name = p.get("norm_name", "Unknown")
            status = p.get("halal_status", "Unknown")
            cat = f"{p.get('category_l1', '')} / {p.get('category_l2', '')}".strip(" /")
            companies = ", ".join((p.get("companies") or [])[:2])
            certs = ", ".join(p.get("cert_bodies") or [])
            expiry = p.get("cert_expiry")
            expired_note = ""
            if expiry and expiry < today:
                expired_note = " [EXPIRED]"

            line = f"- {name} | Status: {status} | Category: {cat}"
            if companies:
                line += f" | Company: {companies}"
            if certs:
                line += f" | Certified by: {certs}"
            if expiry:
                line += f" | Cert expiry: {expiry}{expired_note}"
            # Health info for E-numbers
            health = (p.get("health_info") or [])[:1]
            if health:
                line += f" | Info: {health[0][:100]}"
            uses = (p.get("typical_uses") or [])[:3]
            if uses:
                line += f" | Uses: {', '.join(uses)}"
            product_lines.append(line)

    if product_lines:
        parts.extend(product_lines)
    elif tool_result.results:
        # Had results but all filtered out by threshold — not a real match
        parts.append("Product/company NOT found in the verified database. The search returned only unrelated results.")
    elif tool_result.not_in_database:
        parts.append("Product/company NOT found in the verified database.")

    if not product_lines and not tool_result.not_in_database and not tool_result.results:
        parts.append("No results found in the database.")

    if tool_result.web_results:
        parts.append(f"\nWeb search results (unverified):\n{tool_result.web_results}")

    if tool_result.fuzzy_warning:
        parts.append(f"Note: {tool_result.fuzzy_warning}")

    return "\n".join(parts) if parts else "No results found in the database."


async def _execute_tool(
    tool_name: str,
    tool_args: dict,
    embed_svc: EmbedService,
    qdrant_svc: QdrantService,
    company_store: CompanyStore,
) -> tuple[str, ToolResult | None]:
    """Execute a tool by name, return (formatted_string, raw_tool_result)."""

    if tool_name == "search_product":
        product = tool_args.get("product", "")
        company_name = tool_args.get("company")
        category = resolve_category(tool_args.get("category"))
        location = tool_args.get("location")

        resolved_company = None
        fuzzy_warning = None
        if company_name:
            match = company_store.fuzzy_match(company_name)
            if match:
                resolved_company = match["matched"]
                if match["dist"] > 0.05:
                    fuzzy_warning = f'Matched company: "{match["matched"]}" (from "{company_name}")'

        schema = ProductQuerySchema(product=product, company=resolved_company, category=category)
        tool = ProductTool()
        result = await tool.execute(
            schema,
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
            resolved_company=resolved_company,
            classified_company=company_name,
            original_query=f"{company_name or ''} {product}".strip(),
        )
        if fuzzy_warning:
            result.fuzzy_warning = fuzzy_warning

        # Name-relevance check: if no results actually match the queried brand/product,
        # skip junk results and fall back to web search immediately
        relevant = _filter_products(result, tool_name="search_product", tool_args=tool_args, location=location)
        if not relevant and result.results:
            original_query = f"{company_name or ''} {product}".strip()
            if location:
                original_query += f" in {location}"
            web_results = await _web_search(original_query)
            fallback = ToolResult(not_in_database=True, web_results=web_results)
            return _format_tool_result(fallback), fallback

        return _format_tool_result(result), result

    elif tool_name == "search_company":
        company_name = tool_args.get("company", "")
        category = resolve_category(tool_args.get("category"))

        resolved_company = company_name
        match = company_store.fuzzy_match(company_name)
        if match:
            resolved_company = match["matched"]

        schema = CompanyQuerySchema(company=resolved_company, category=category)
        tool = CompanyTool()
        result = await tool.execute(
            schema,
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
            original_query=company_name,
        )

        # Fallback: no results → web search
        if not result.results:
            web_results = await _web_search(f"{company_name} halal products")
            fallback = ToolResult(not_in_database=True, web_results=web_results)
            return _format_tool_result(fallback), fallback

        return _format_tool_result(result), result

    elif tool_name == "search_enumber":
        e_code = tool_args.get("e_code", "")
        schema = ENumberQuerySchema(e_code=e_code)
        tool = ENumberTool()
        result = await tool.execute(schema, qdrant_svc=qdrant_svc)

        # Fallback: no results → web search
        if not result.results:
            web_results = await _web_search(f"{e_code} halal status")
            fallback = ToolResult(not_in_database=True, web_results=web_results)
            return _format_tool_result(fallback), fallback

        return _format_tool_result(result), result

    elif tool_name == "search_category":
        category = tool_args.get("category", "")
        hint = tool_args.get("hint", category)
        location = tool_args.get("location") 
        schema = CategoryBrowseSchema(category=category, hint=hint)
        tool = CategoryTool()
        result = await tool.execute(schema, embed_svc=embed_svc, qdrant_svc=qdrant_svc)

        # Fallback: no results → web search
        filtered = _filter_products(result, location=location)
        if not filtered:
            query = f"halal {category} products"
            if location:
                query += f" in {location}"
            web_results = await _web_search(query)
            fallback = ToolResult(not_in_database=True, web_results=web_results)
            return _format_tool_result(fallback), fallback

        return _format_tool_result(result), result

    elif tool_name == "web_search":
        query = tool_args.get("query", "")
        web_results = await _web_search(query)
        result = ToolResult(not_in_database=True, web_results=web_results)
        return _format_tool_result(result), result

    return "Unknown tool.", None


# ── E-number regex pre-check ─────────────────────────────────────────────────

def _detect_enumber(query: str) -> str | None:
    """Regex catch for E-numbers — guarantees they always hit search_enumber."""
    m = re.search(r"\bE[-\s]?(\d{3,4}[a-z]?)\b", query, re.IGNORECASE)
    if m:
        return f"E{m.group(1).upper()}"
    return None


# ── Main agent ───────────────────────────────────────────────────────────────

async def run_agent(
    user_query: str,
    embed_svc: EmbedService,
    qdrant_svc: QdrantService,
    company_store: CompanyStore,
) -> AsyncIterator[dict]:
    """
    Runs the main Groq agent. Yields dicts:
      {"type": "thinking", "content": "..."}
      {"type": "tool_call", "tool": "...", "args": {...}}
      {"type": "token", "content": "..."}
      {"type": "tool_result", "products": [...], "summary": ..., "web_results": ...}
      {"type": "done"}

    Tool results are collected internally and only yielded AFTER the LLM
    has streamed its curated final response, so the user sees one coherent
    answer instead of a raw tool dump followed by a second LLM narrative.
    """
    settings = get_settings()

    # format which Groq rejects with 400 tool_use_failed.
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=settings.GROQ_API_KEY,
        temperature=0.3,
    )
    llm_with_tools = llm.bind_tools(TOOL_DEFINITIONS)

    messages: list[Any] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_query),
    ]

    # Accumulate tool results so we can emit them after the LLM response
    collected_products: list[dict] = []
    collected_summary: dict | None = None
    collected_web_results: str | None = None

    def _collect(raw_result: ToolResult | None, tool_name: str = "", tool_args: dict | None = None):
        nonlocal collected_products, collected_summary, collected_web_results
        if not raw_result:
            return
        location = (tool_args or {}).get("location")
        products = _filter_products(raw_result, tool_name=tool_name, tool_args=tool_args, location=location)
        if products:
            collected_products = products[:8]
        if raw_result.summary:
            collected_summary = raw_result.summary
        if raw_result.web_results:
            collected_web_results = raw_result.web_results

    # E-number regex pre-check — force tool call
    e_code = _detect_enumber(user_query)
    if e_code:
        yield {"type": "thinking", "content": "Looking up E-number..."}
        yield {"type": "tool_call", "tool": "search_enumber", "args": {"e_code": e_code}}

        formatted, raw_result = await _execute_tool(
            "search_enumber", {"e_code": e_code}, embed_svc, qdrant_svc, company_store
        )
        _collect(raw_result, tool_name="search_enumber", tool_args={"e_code": e_code})

        # Add the tool interaction to messages so the LLM can narrate
        messages.append(AIMessage(content="", tool_calls=[{
            "id": "enumber_0",
            "name": "search_enumber",
            "args": {"e_code": e_code},
        }]))
        messages.append(ToolMessage(content=formatted, tool_call_id="enumber_0"))

        # Stream the final response
        yield {"type": "thinking", "content": "Generating response..."}
        llm_stream = ChatGroq(
            model="openai/gpt-oss-120b",
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            streaming=True,
        ).bind_tools(TOOL_DEFINITIONS)

        async for chunk in llm_stream.astream(messages):
            if chunk.content:
                yield {"type": "token", "content": chunk.content}

        # Emit collected tool results after the LLM response
        if collected_products or collected_web_results:
            yield {
                "type": "tool_result",
                "products": collected_products,
                "summary": collected_summary,
                "web_results": collected_web_results,
            }
        yield {"type": "done"}
        return

    # Normal agent loop
    max_iterations = 5
    for _ in range(max_iterations):
        yield {"type": "thinking", "content": "Thinking..."}

        try:
            response: AIMessage = await llm_with_tools.ainvoke(messages)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            # Only catch Groq's tool_use_failed (400). Re-raise anything else.
            if "tool_use_failed" not in str(exc):
                raise
            # The model emitted a malformed tool call. Retry once with a clean
            # single-message context so accumulated history can't corrupt the call.
            yield {"type": "thinking", "content": "Retrying..."}
            retry_messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_query),
            ]
            try:
                response = await llm_with_tools.ainvoke(retry_messages)
            except Exception:
                yield {"type": "token", "content": "Sorry, I had trouble processing your request. Please try rephrasing your question."}
                yield {"type": "done"}
                return
            messages = retry_messages
            
        if not response.tool_calls:
            # No tool calls — this is the final answer. Stream it.
            messages.append(response)
            yield {"type": "thinking", "content": "Generating response..."}

            llm_stream = ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                streaming=True,
            ).bind_tools(TOOL_DEFINITIONS)

            async for chunk in llm_stream.astream(messages[:-1]):
                # Re-stream without the non-streaming response
                if chunk.content:
                    yield {"type": "token", "content": chunk.content}

            # Emit collected tool results after the LLM response
            if collected_products or collected_web_results:
                yield {
                    "type": "tool_result",
                    "products": collected_products,
                    "summary": collected_summary,
                    "web_results": collected_web_results,
                }
            yield {"type": "done"}
            return

        # Has tool calls — execute them
        messages.append(response)

        for tc in response.tool_calls:
            tool_name = tc["name"]
            tool_args = sanitize_tool_args(tc["args"])
            tool_id = tc["id"]

            yield {"type": "tool_call", "tool": tool_name, "args": tool_args}

            formatted, raw_result = await _execute_tool(
                tool_name, tool_args, embed_svc, qdrant_svc, company_store
            )
            _collect(raw_result, tool_name=tool_name, tool_args=tool_args)

            messages.append(ToolMessage(content=formatted, tool_call_id=tool_id))

    # If we exhausted iterations, stream whatever we have
    yield {"type": "token", "content": "I apologize, I had trouble processing your request. Please try rephrasing your question."}
    yield {"type": "done"}
