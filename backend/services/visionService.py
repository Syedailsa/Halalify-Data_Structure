from __future__ import annotations

import httpx
from config import get_settings

SYSTEM_PROMPT = """You are a specialized Halal compliance AI.
Your job is to analyze images for Halal/Haram status (Food, Ingredients, Cosmetics, Tourism, Cigarettes and any consumable item).
If the user provides a barcode image, identify the product and check its Halal status.

STRICT RULES:
1. If the image contains a football, hand, car, person, furniture, or any random object NOT related to Halal/Food/Cosmetics, reply ONLY: "I can only assist with Halal-related matters. This image appears irrelevant."
2. Do not describe irrelevant objects. Reject them immediately.
3. If the image is valid (food label, ingredient list, product, barcode, etc.), analyze it for Halal compliance.
"""

DEFAULT_USER_PROMPT = (
    "Check this image for Halal/Haram status. "
    "If it is irrelevant to Halal topics, reject it."
)


async def analyze_image(base64_image: str, user_prompt: str | None = None) -> str:
    """
    Send a base64 image to Fireworks AI vision model and return the analysis.

    Args:
        base64_image: Full data URI string, e.g. "data:image/jpeg;base64,/9j/..."
        user_prompt:  Optional extra question from the user about the image.

    Returns:
        The model's text response.
    """
    settings = get_settings()
    api_key = settings.FIREWORKS_API_KEY

    final_prompt = (
        f'User Question: "{user_prompt}". '
        "(Remember: Reject if image is not related to Food/Halal/Cosmetics)"
        if user_prompt
        else DEFAULT_USER_PROMPT
    )

    payload = {
        "model": "accounts/fireworks/models/kimi-k2p5",
        "max_tokens": 2048,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": final_prompt},
                    {"type": "image_url", "image_url": {"url": base64_image}},
                ],
            },
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.fireworks.ai/inference/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    except httpx.HTTPStatusError as e:
        print(f"[VisionService] HTTP error {e.response.status_code}: {e.response.text}")
        return "I had trouble analyzing that image. Please try again."
    except Exception as e:
        print(f"[VisionService] Unexpected error: {e}")
        return "I had trouble analyzing that image. Please try again."
    