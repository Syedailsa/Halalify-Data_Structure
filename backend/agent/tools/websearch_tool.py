from __future__ import annotations

import httpx

from config import get_settings


async def web_search(q: str) -> str:
    settings = get_settings()
    if not settings.GOOGLE_API_KEY or not settings.GOOGLE_CX_ID:
        return "Web search not configured. Unable to search the web for this query."

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": settings.GOOGLE_API_KEY,
                    "cx": settings.GOOGLE_CX_ID,
                    "q": f"{q} can muslims have it?",
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
            return "No web results found for this query."

        lines = []
        for i, item in enumerate(items, 1):
            lines.append(
                f"  {i}. {item.get('title', '')}\n"
                f"     {item.get('link', '')}\n"
                f"     {item.get('snippet', '')}"
            )
        return "\n\n".join(lines)

    except httpx.TimeoutException:
        return "Web search timed out. Please try again."
    except Exception as e:
        print(f"[web_search] Error: {e}")
        return f"Web search failed: {str(e)}"

# import asyncio

# if __name__ == "__main__":
#     result = asyncio.run(web_search("Is shahi halal?"))
#     print(result)