from __future__ import annotations

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from config import get_settings

_FALLBACK = {
    "is_relevant": False,
    "rejection_message": (
        "This scan doesn't appear to be a halal-relevant consumer product. "
        "Try scanning a barcode printed on food, beverage, or cosmetic packaging."
    ),
    "content_type": "irrelevant",
    "product_name": "",
    "brand": "",
}

_SYSTEM_PROMPT = """You are a barcode and QR code content classifier for a halal product verification app.

Given raw scanned content, return a JSON schema identifying what was scanned.

CONTENT TYPES:
- "numeric_barcode"  : purely numeric string (EAN-13, UPC-A, or any digit-only barcode)
- "product_text"     : text that is SPECIFICALLY a consumer product name or brand
                       — e.g. "Kit Kat", "Nestle Water", "Coca-Cola Original", "Dove Shampoo"
- "url"              : a URL — may or may not lead to a consumer product page
- "irrelevant"       : everything else — see IRRELEVANT EXAMPLES below

IRRELEVANT EXAMPLES (must be classified as "irrelevant"):
- Store/business signs: "Open 24 Hours", "Welcome", "Exit", "No Entry", "Cashier"
- Slogans or marketing copy: "Best Value", "New & Improved", "Limited Time Offer"
- WiFi credentials: "WIFI:S:NetworkName;T:WPA;P:pass;;"
- URLs for non-product pages: login pages, WiFi portals, documents, tickets
- Internal codes, IDs, reference numbers
- Generic phrases that are NOT a specific product name or brand
- Personal info, contact details, addresses

RULE: "product_text" requires the text to be a SPECIFIC named product or brand sold as food,
beverage, cosmetic, or pharmaceutical. A vague phrase, sign text, or slogan is NEVER product_text.

RELEVANCE RULES:
- numeric_barcode → always is_relevant=true
- product_text    → always is_relevant=true
- url             → is_relevant=true only if clearly a consumer product/brand website
- irrelevant      → always is_relevant=false

Return ONLY valid JSON — no reasoning, no explanation, no markdown:
{
  "is_relevant": true,
  "rejection_message": "",
  "content_type": "numeric_barcode",
  "product_name": "",
  "brand": ""
}

Field rules:
- rejection_message : warm one-sentence message when is_relevant=false, empty string otherwise
- product_name      : specific product name from the text or URL; empty if not determinable
- brand             : brand or manufacturer name; empty if not determinable
- For numeric_barcode: product_name and brand must always be empty strings
- For url: extract product/brand from domain or path if possible (e.g. "coca-cola.com" → brand="Coca-Cola")
"""


async def extract_barcode_schema(raw: str) -> dict:
    """
    Classify raw barcode/QR content and extract a structured schema.
    Returns dict with keys: is_relevant, rejection_message, content_type,
    product_name, brand.
    Falls back to _FALLBACK (is_relevant=False) on any error.
    """
    settings = get_settings()
    print(f"[BARCODE] Extracting schema for: {raw!r}")

    try:
        llm = ChatGroq(
            model="llama-3.1-8b-instant",  # fast + cheap for this lightweight task
            api_key=settings.GROQ_API_KEY,
            temperature=0,
        )
        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=f"Scanned content: {raw}"),
        ]
        response = await llm.ainvoke(messages)
        raw_text = (response.content or "").strip()
        print(f"[BARCODE] Schema raw: {raw_text[:300]}")

        # Strip markdown fences then extract the JSON object
        clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text, flags=re.DOTALL).strip()
        json_match = re.search(r"\{.*\}", clean, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON object found in response")

        schema = json.loads(json_match.group())
        print(
            f"[BARCODE] Schema parsed: is_relevant={schema.get('is_relevant')} "
            f"content_type={schema.get('content_type')!r} "
            f"product={schema.get('product_name')!r} brand={schema.get('brand')!r}"
        )
        return {**_FALLBACK, **schema}

    except Exception as e:
        print(f"[BARCODE] Schema extraction failed: {e} — using fallback")
        return dict(_FALLBACK)
