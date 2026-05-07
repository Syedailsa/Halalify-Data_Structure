"""
Quick async test for the location-aware agent.
Runs two scenarios:
  1. User in Malaysia  →  simple halal query (cert_body_hint = JAKIM)
  2. User in Pakistan  →  query mentioning Malaysia (agent should call get_cert_body_for_country
                           and re-run semantic_search with cert_body_hint = JAKIM)

Run from the backend/ directory:
  python test_location.py
"""

from __future__ import annotations

import asyncio
import os
import sys

# Force UTF-8 output on Windows so LLM responses with Unicode don't crash
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.local"))

from config import get_settings
from services.embed_service import EmbedService
from services.qdrant_client import QdrantService
from agent.orchestrator import run_agent
from utils.category import get_cert_bodies

SEP = "-" * 65


async def run_test(
    label: str,
    query: str,
    country: str | None,
    cert_bodies: list[str],
    embed_svc: EmbedService,
    qdrant_svc: QdrantService,
) -> None:
    print(f"\n{SEP}")
    print(f"  TEST : {label}")
    print(f"  QUERY: {query!r}")
    if country:
        print(f"  LOC  : {country} -> {cert_bodies}")
    else:
        print(f"  LOC  : (no location)")
    print(SEP)

    full_response = ""
    async for event in run_agent(
        user_query=query,
        embed_svc=embed_svc,
        qdrant_svc=qdrant_svc,
        country=country,
        cert_bodies=cert_bodies,
    ):
        etype = event.get("type")
        if etype == "thinking":
            print(f"  [thinking]   {event.get('content')}")
        elif etype == "tool_call":
            tool = event.get("tool", "")
            args = event.get("args", {})
            hint = args.get("cert_body_hint")
            print(f"  [tool_call]  {tool}({', '.join(f'{k}={v!r}' for k, v in args.items())})")
            if tool == "semantic_search" and hint:
                print(f"               ^ cert_body_hint = {hint!r}  OK")
        elif etype == "token":
            full_response += event.get("content", "")
        elif etype == "tool_result":
            products = event.get("products", [])
            print(f"  [products]   {len(products)} result(s) returned")
            for p in products[:3]:
                print(f"               • {p.get('norm_name')} | {p.get('halal_status')} | cert: {p.get('cert_bodies')}")
        elif etype == "error":
            print(f"  [ERROR]      {event.get('content')}")
        elif etype == "done":
            print(f"\n  [response]\n{full_response.strip()}\n")


async def main() -> None:
    settings = get_settings()
    embed_svc = EmbedService(settings.FIREWORKS_API_KEY)
    qdrant_svc = QdrantService(settings.QDRANT_URL, settings.QDRANT_API_KEY)

    try:
        # ── Test 1: User in Malaysia, normal query ────────────────────────────
        await run_test(
            label="Malaysia location, normal query",
            query="is Maggi noodles halal?",
            country="Malaysia",
            cert_bodies=get_cert_bodies("Malaysia"),
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
        )

        # ── Test 2: User in Pakistan, mentions Malaysia in query ──────────────
        # Agent should: call get_cert_body_for_country("Malaysia"),
        # then re-call semantic_search with cert_body_hint="JAKIM"
        await run_test(
            label="Pakistan location, cross-country query (Malaysia)",
            query="is Kit Kat halal in Malaysia?",
            country="Pakistan",
            cert_bodies=get_cert_bodies("Pakistan"),
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
        )

        # ── Test 3: No location, user explicitly names a cert authority ───────
        await run_test(
            label="No location, user asks for IFANCA certified",
            query="I want IFANCA certified chocolate products",
            country=None,
            cert_bodies=[],
            embed_svc=embed_svc,
            qdrant_svc=qdrant_svc,
        )

    finally:
        await embed_svc.close()
        await qdrant_svc.close()

    print(f"\n{SEP}")
    print("  All tests done.")
    print(SEP)


if __name__ == "__main__":
    asyncio.run(main())
