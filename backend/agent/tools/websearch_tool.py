from __future__ import annotations

import json
import httpx

from config import get_settings


async def web_search(q: str) -> str:
    settings = get_settings()
    if not settings.GOOGLE_API_KEY or not settings.GOOGLE_CX_ID:
        return "Web search not configured. Unable to search the web for this query."

    print(f"[SEARCH] Google search: {q!r}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": settings.GOOGLE_API_KEY,
                    "cx": settings.GOOGLE_CX_ID,
                    "q": f"{q}, tell me its Halal status?",
                    "num": "3",
                },
            )
            data = res.json()

        # Surface API errors clearly
        if "error" in data:
            error_msg = data["error"].get("message", "Unknown API error")
            print(f"[web_search] Google API error: {error_msg}")
            return f"Web search unavailable: {error_msg}"

        items = data.get("items") or []
        if not items:
            print(f"[SEARCH] No results for: {q!r}")
            return json.dumps([])
        print(f"[SEARCH] Got {len(items)} results for: {q!r}")

        results = [
            {
                "index": i,
                "title": item.get("title", ""),
                "url":   item.get("link", ""),
                "snippet": item.get("snippet", ""),
            }
            for i, item in enumerate(items)
        ]
        return json.dumps(results)

    except httpx.TimeoutException:
        return "Web search timed out. Please try again."
    except Exception as e:
        print(f"[web_search] Error: {e}")
        return f"Web search failed: {str(e)}"

# import asyncio

# if __name__ == "__main__":
#     result = asyncio.run(web_search("Is shahi halal?"))
#     print(result)