from __future__ import annotations

import json
import re

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

VISION_FALLBACK_PROMPT = (
    "Analyze this product image for halal status. "
    "Focus on: (1) List every visible ingredient and flag any that may be haram — "
    "e.g. alcohol, pork/lard derivatives, gelatin (unless fish/plant-based), carmine (E120), "
    "rennet, or any ambiguous E-numbers. "
    "(2) Note any halal or haram certification logos or marks visible on the packaging. "
    "(3) Give a clear overall halal assessment based solely on what is visible. "
    "Be honest about anything you cannot confirm from the image alone."
)

_SCHEMA_PROMPT = """Analyze this image and extract product information. Reply with ONLY a JSON object — no markdown, no explanation.

Determine if this image is relevant to halal verification (food, beverage, cosmetic, pharmaceutical, or any packaged consumer product). Irrelevant means: person, furniture, vehicle, landscape, generic documents, or anything not a consumer product.

Return exactly:
{
  "is_relevant": true,
  "rejection_message": "",
  "product_name": "",
  "brand": "",
  "category": "",
  "ingredients": [],
  "halal_tag": ""
}

Field rules:
- is_relevant: false only if the image has no consumer product at all
- rejection_message: warm, one-sentence message and reminder that it is not relevant to halal topic, when is_relevant is false; empty string otherwise
- product_name: exact product name from packaging label (empty string if not visible)
- brand: brand or manufacturer name (empty string if not visible)
- category: "food", "beverage", "cosmetic", "pharma", or empty string
- ingredients: array of ingredient strings if an ingredient list is visible; empty array otherwise
- halal_tag: any halal certificate, haram warning, or certification text visible; empty string if none"""


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

    print(f"[VISION] Calling kimi-k2p5 model with user prompt: {final_prompt!r}")
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
            result = data["choices"][0]["message"]["content"]
            print(f"[VISION] Response received ({len(result)} chars)")
            return result

    except httpx.HTTPStatusError as e:
        print(f"[VisionService] HTTP error {e.response.status_code}: {e.response.text}")
        return "I had trouble analyzing that image. Please try again."
    except Exception as e:
        print(f"[VisionService] Unexpected error: {e}")
        return "I had trouble analyzing that image. Please try again."


_SCHEMA_FALLBACK = {
    "is_relevant": True,
    "rejection_message": "",
    "product_name": "",
    "brand": "",
    "category": "",
    "ingredients": [],
    "halal_tag": "",
}


async def extract_image_schema(base64_image: str) -> dict:
    """
    Call the vision model to extract a structured product schema from an image.
    Returns a dict with keys: is_relevant, rejection_message, product_name,
    brand, category, ingredients, halal_tag.
    Falls back to _SCHEMA_FALLBACK (is_relevant=True, all fields empty) on any error.
    """
    settings = get_settings()
    api_key = settings.FIREWORKS_API_KEY

    payload = {
        "model": "accounts/fireworks/models/kimi-k2p5",
        "max_tokens": 512,
        "messages": [
            {
                "role": "system",
                "content": "Output only valid JSON. No reasoning, no explanation, no markdown fences.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _SCHEMA_PROMPT},
                    {"type": "image_url", "image_url": {"url": base64_image}},
                ],
            },
        ],
    }

    print("[VISION] Extracting product schema from image...")
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
            raw = response.json()["choices"][0]["message"]["content"].strip()
            print(f"[VISION] Schema raw: {raw[:300]}")

            # Strip markdown fences, then extract the first JSON object
            # — handles models that think out loud before outputting JSON
            clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL).strip()
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            if not json_match:
                raise json.JSONDecodeError("No JSON object found in response", clean, 0)
            schema = json.loads(json_match.group())

            print(f"[VISION] Schema parsed: relevant={schema.get('is_relevant')}, "
                  f"product={schema.get('product_name')!r}, brand={schema.get('brand')!r}")
            return {**_SCHEMA_FALLBACK, **schema}
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"[VISION] Schema parse error: {e} — using fallback")
        return dict(_SCHEMA_FALLBACK)
    except httpx.HTTPStatusError as e:
        print(f"[VISION] HTTP error {e.response.status_code}: {e.response.text}")
        return dict(_SCHEMA_FALLBACK)
    except Exception as e:
        print(f"[VISION] Unexpected schema error: {e}")
        return dict(_SCHEMA_FALLBACK)
