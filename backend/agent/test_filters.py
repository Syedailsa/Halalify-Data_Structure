import os
import json
from langchain_fireworks import FireworksEmbeddings
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage, SystemMessage
from langchain.agents import create_agent
from qdrant_client import QdrantClient, models
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
QDRANT_URL        = os.getenv("QDRANT_URL")
QDRANT_API_KEY    = os.getenv("QDRANT_API_KEY")
GROQ_API_KEY      = os.getenv("GROQ_API_KEY")

qdrant_client   = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=120)
embedding_model = FireworksEmbeddings(api_key=FIREWORKS_API_KEY, model="fireworks/qwen3-embedding-8b")

SCORE_THRESHOLD = 0.65
SEMANTIC_POOL   = 10  
DEFAULT_MODEL   = "openai/gpt-oss-120b"

SUPPORTED_MODELS = {
    "GPT OSS 120B":  "openai/gpt-oss-120b",
    "GPT OSS 20B":   "openai/gpt-oss-20b",
    "Llama 3.3 70B": "llama-3.3-70b-versatile",
    "Llama 3.1 8B":  "llama-3.1-8b-instant",
}

@tool
def semantic_search(text: str) -> list[dict]:
    """
    Embed the query and fetch top SEMANTIC_POOL results from Qdrant.
    No filters applied here — pure vector similarity.
    Returns serialized payloads for the agent to read and filter.
    """
    print(f"\n  [SEMANTIC] Embedding query: '{text}'")

    try:
        query_embedding = embedding_model.embed_query(text)
        print(f"  [SEMANTIC] ✓ Embedding done ({len(query_embedding)} dims)")
    except Exception as e:
        print(f"  [SEMANTIC] ✗ Embedding failed: {e}")
        return []

    print(f"  [SEMANTIC] Fetching top {SEMANTIC_POOL} results from Qdrant...")

    try:
        results = qdrant_client.query_points(
            collection_name="halal_products_test",
            query=query_embedding,
            using="halal_product_dense_vector",
            with_vectors=False,
            limit=SEMANTIC_POOL,
            score_threshold=SCORE_THRESHOLD,
        )
        print(f"  [SEMANTIC] ✓ {len(results.points)} results above threshold {SCORE_THRESHOLD}")
    except Exception as e:
        print(f"  [SEMANTIC] ✗ Qdrant error: {e}")
        return []

    # Serialize all payload fields for the agent to read
    pool = []
    for p in results.points:
        pool.append({
            "id":           p.id,
            "score":        round(p.score, 4),
            "norm_name":    p.payload.get("norm_name"),
            "halal_status": p.payload.get("halal_status"),
            "companies":    p.payload.get("companies"),
            "category_l1":  p.payload.get("category_l1"),
            "category_l2":  p.payload.get("category_l2"),
            "sold_in":      p.payload.get("sold_in"),
            "cert_bodies":  p.payload.get("cert_bodies"),
            "marketplace":  p.payload.get("marketplace"),
            "health_info":  p.payload.get("health_info"),
            "barcodes":     p.payload.get("barcodes"),
        })

    # Print the pool so you can see what semantics retrieved
    print(f"\n  [SEMANTIC] Pool returned to agent:")
    for i, p in enumerate(pool, 1):
        print(f"    {i}. [{p['score']}] {p['norm_name']} | {p['halal_status']} | {p['companies']}")

    return pool


@tool
def filter_semantic_results(
    pool:         str,       # JSON string of the semantic pool
    user_query:   str,       # original user query for context
    norm_name:    str        = None,
    category_l1:  str        = None,
    category_l2:  str        = None,
    halal_status: str        = None,
    sold_in:      List[str]  = None,
    marketplace:  List[str]  = None,
    companies:    List[str]  = None,
    cert_bodies:  List[str]  = None,
    health_info:  List[str]  = None,
    barcodes:     List[str]  = None,
) -> dict:
    """
    Filter the semantic search pool using values SEEN in the pool data.
    The agent reads the pool first, then calls this with filters derived
    from the actual product data — not from the raw user query.
    This avoids misspelling/casing issues since filters come from real DB values.

    Args:
        pool:         JSON string of semantic results — passed automatically
        user_query:   The original user query for context
        norm_name:    Product name EXACTLY as seen in the pool e.g. 'Kit Kat'
        category_l1:  Category EXACTLY as seen in the pool e.g. 'Food'
        category_l2:  Sub-category EXACTLY as seen in the pool e.g. 'Snacks & Confectionery'
        halal_status: Status EXACTLY as seen in the pool e.g. 'Halal', 'Haraam', 'Mushbooh'
        sold_in:      Regions EXACTLY as seen in the pool e.g. ['Singapore']
        marketplace:  Marketplace EXACTLY as seen in the pool e.g. ['Retail']
        companies:    Company names EXACTLY as seen in the pool e.g. ['Nestle']
        cert_bodies:  Cert bodies EXACTLY as seen in the pool e.g. ['IFANCA']
        health_info:  Health info EXACTLY as seen in the pool
        barcodes:     Barcodes EXACTLY as seen in the pool
    """
    print(f"\n  [FILTER TOOL] Agent is filtering with:")
    print(f"    user_query:   {user_query}")
    print(f"    norm_name:    {norm_name}")
    print(f"    halal_status: {halal_status}")
    print(f"    companies:    {companies}")
    print(f"    category_l1:  {category_l1}")
    print(f"    category_l2:  {category_l2}")
    print(f"    sold_in:      {sold_in}")
    print(f"    cert_bodies:  {cert_bodies}")

    # Parse the pool back from JSON string
    try:
        products = json.loads(pool)
    except Exception as e:
        return {"error": f"Failed to parse pool: {e}"}

    filtered = []

    for p in products:
        match = True

        if norm_name:
            db_val = (p.get("norm_name") or "").lower()
            if norm_name.lower() not in db_val:
                match = False
                print(f"  [FILTER] ✗ norm_name: '{norm_name}' not in '{db_val}'")

        if halal_status:
            db_val = (p.get("halal_status") or "").lower()
            if halal_status.lower() not in db_val:
                match = False
                print(f"  [FILTER] ✗ halal_status: '{halal_status}' not in '{db_val}'")

        if category_l1:
            db_val = (p.get("category_l1") or "").lower()
            if category_l1.lower() not in db_val:
                match = False
                print(f"  [FILTER] ✗ category_l1: '{category_l1}' not in '{db_val}'")

        if category_l2:
            db_val = (p.get("category_l2") or "").lower()
            if category_l2.lower() not in db_val:
                match = False
                print(f"  [FILTER] ✗ category_l2: '{category_l2}' not in '{db_val}'")

        if companies:
            db_val = " ".join(p.get("companies") or []).lower()
            if not any(c.lower() in db_val for c in companies):
                match = False
                print(f"  [FILTER] ✗ companies: {companies} not in '{db_val}'")

        if sold_in:
            db_val = " ".join(p.get("sold_in") or []).lower()
            if not any(s.lower() in db_val for s in sold_in):
                match = False
                print(f"  [FILTER] ✗ sold_in: {sold_in} not in '{db_val}'")

        if cert_bodies:
            db_val = " ".join(p.get("cert_bodies") or []).lower()
            if not any(c.lower() in db_val for c in cert_bodies):
                match = False
                print(f"  [FILTER] ✗ cert_bodies: {cert_bodies} not in '{db_val}'")

        if marketplace:
            db_val = " ".join(p.get("marketplace") or []).lower()
            if not any(m.lower() in db_val for m in marketplace):
                match = False
                print(f"  [FILTER] ✗ marketplace: {marketplace} not in '{db_val}'")

        if health_info:
            db_val = " ".join(p.get("health_info") or []).lower()
            if not any(h.lower() in db_val for h in health_info):
                match = False
                print(f"  [FILTER] ✗ health_info: {health_info} not in '{db_val}'")

        if barcodes:
            db_val = " ".join(p.get("barcodes") or []).lower()
            if not any(b.lower() in db_val for b in barcodes):
                match = False
                print(f"  [FILTER] ✗ barcodes: {barcodes} not in '{db_val}'")

        if match:
            print(f"  [FILTER] ✓ Match: {p.get('norm_name')} | {p.get('halal_status')}")
            filtered.append(p)

    print(f"\n  [FILTER TOOL] {len(filtered)} match(es) after filtering")

    # Fallback — if filters too strict, return full semantic pool
    if not filtered:
        print("  [FILTER TOOL] ⚠️  No matches — falling back to full semantic pool")
        return {
            "results": products,
            "count": len(products),
            "fallback": True,
            "message": "Filters returned no results, showing semantic results instead."
        }

    return {"results": filtered, "count": len(filtered), "fallback": False}



def get_llm(model_key: str = None) -> ChatGroq:
    if not model_key:
        model_id = DEFAULT_MODEL
    elif model_key in SUPPORTED_MODELS:
        model_id = SUPPORTED_MODELS[model_key]
    elif model_key in SUPPORTED_MODELS.values():
        model_id = model_key
    else:
        print(f"⚠️  Model '{model_key}' not found, falling back to default.")
        model_id = DEFAULT_MODEL
    return ChatGroq(model=model_id, api_key=GROQ_API_KEY, temperature=0.3)


SYSTEM_PROMPT = """You are **Halalify Assistant**, a halal product search agent.
Your job is to help users find accurate halal product information from a verified database.

## Query Classification — decide FIRST

### Product Queries — TWO step process (MANDATORY):
Any query about food, drinks, cosmetics, supplements, or halal/haraam status.

Step 1 → call semantic_search(text=user_query)
         This returns a pool of real products from the database.

Step 2 → READ the pool carefully, then call filter_semantic_results with:
         - pool: JSON string of the pool from Step 1
         - user_query: the original user query
         - filters derived from ACTUAL VALUES you see in the pool

## Filter Rules (Step 2)
- Derive filter values from WHAT YOU SEE IN THE POOL — not from raw user text
  (user may have misspelled — the pool has the correct DB values)
- "is kat kit halal?" + pool has norm_name="Kit Kat" → use norm_name="Kit Kat"
- "nestle products" + pool has companies=["Nestle S.A."] → use companies=["Nestle S.A."]
- "is X halal?" → halal_status="Halal" (from user intent) + norm_name from pool
- Only include filters relevant to the user's intent — leave others as None

## Non-Product Queries — Reply DIRECTLY, no tools:
- "hi", "hello", "how are you?" → greet warmly, ask how you can help
- "what is your name?"          → introduce yourself as Halalify Assistant
- Off-topic questions            → politely redirect to halal products

## Response Format (product queries only)
After filter_semantic_results returns:
1. Structured product list — name, company, halal status, category
2. Short NL summary — directly answer the user's question
If fallback=True in results → mention exact match wasn't found but showing similar results.

## Rules
- NEVER fabricate product data — only use what tools return
- NEVER skip Step 1 for product queries — always search first
- You are strictly a halal product assistant — redirect off-topic queries politely
"""



def print_tool_calls(response: dict):
    """Print tool calls and results from agent message history."""
    messages = response.get("messages", [])
    for msg in messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                # Print args except pool (too verbose)
                args = {k: v for k, v in tc["args"].items()
                        if v is not None and k != "pool"}
                print(f"\n  🔧 Agent called : {tc['name']}")
                for k, v in args.items():
                    print(f"     {k}: {v}")

        if isinstance(msg, ToolMessage):
            try:
                data = json.loads(msg.content)
                fallback = data.get("fallback", False)
                count = data.get("count", 0)
                label = "⚠️  fallback" if fallback else "✓ filtered"
                print(f"\n  📦 Tool returned : {count} product(s) [{label}]")
                for p in data.get("results", [])[:4]:  # show max 4
                    print(f"     [{p['score']}] {p['norm_name']}")
                    print(f"              Company : {p['companies']}")
                    print(f"              Status  : {p['halal_status']}")
                    print(f"              Sold in : {p['sold_in']}")
                    print(f"              Category: {p['category_l1']} > {p['category_l2']}")
            except Exception:
                print(f"\n  📦 Tool returned : {msg.content}")



agent_registry: dict = {}

def build_agent(model_key: str = None):
    llm = get_llm(model_key)
    return create_agent(
        name="HalalifySearchAgent",
        model=llm,
        tools=[semantic_search, filter_semantic_results],
        system_prompt=SYSTEM_PROMPT,
    )

def get_agent(model_key: str = None):
    key = model_key or DEFAULT_MODEL
    if key not in agent_registry:
        agent_registry[key] = build_agent(model_key)
    return agent_registry[key]



def run_query(query: str, model_key: str = None):
    
    agent = get_agent(model_key)
    response = agent.invoke({
        "messages": [{"role": "user", "content": query}]
    })
    print_tool_calls(response)
    print(f"\n  💬 Answer: {response['messages'][-1].content}")
    return response

# cli interface

def print_banner():
    print("\n" + "="*60)
    print("       🥙  HALALIFY SEARCH ASSISTANT  🥙")
    print("="*60)
    print("  Ask about any halal product, company, or category.")
    print("  Commands: 'exit' to quit | 'model' to switch LLM")
    print("="*60)

def print_models():
    print("\n  Available models:")
    for i, (name, mid) in enumerate(SUPPORTED_MODELS.items(), 1):
        marker = "← default" if mid == DEFAULT_MODEL else ""
        print(f"    {i}. {name} ({mid}) {marker}")

def cli():
    print_banner()
    current_model = None

    while True:
        try:
            user_input = input("\n  You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n  Goodbye! 👋")
            break

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit"):
            print("\n  Goodbye! 👋")
            break

        if user_input.lower() == "model":
            print_models()
            choice = input("  Enter model number or name: ").strip()
            keys = list(SUPPORTED_MODELS.keys())
            if choice.isdigit() and 1 <= int(choice) <= len(keys):
                current_model = keys[int(choice) - 1]
                print(f"  ✅ Switched to: {current_model}")
            elif choice in SUPPORTED_MODELS:
                current_model = choice
                print(f"  ✅ Switched to: {current_model}")
            else:
                print("  ⚠️  Invalid choice, keeping current model.")
            continue

        print(f"\n{'─'*60}")
        run_query(user_input, model_key=current_model)
        print(f"{'─'*60}")


if __name__ == "__main__":
    cli()