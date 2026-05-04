from __future__ import annotations

from typing import List

from config import get_settings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_fireworks import ChatFireworks
from pydantic import BaseModel, Field

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

_SCHEMA_ANALYSIS_PROMPT = (
    "Analyze this image for halal compliance. "
    "Determine if it shows a consumer product (food, beverage, cosmetic, pharmaceutical). "
    "Extract all visible product information and assess its halal status. "
    "Images that are NOT relevant: humans, furniture, vehicles, landscapes, generic documents."
)


class ProductSchema(BaseModel):
    is_relevant: bool = Field(
        description="False only if the image has no consumer product at all"
    )
    rejection_message: str = Field(
        description="Warm one-sentence rejection and reminder when is_relevant is false; empty string otherwise"
    )
    product_name: str = Field(
        description="Exact product name from packaging label; empty string if not visible"
    )
    brand: str = Field(
        description="Brand or manufacturer name; empty string if not visible"
    )
    category: str = Field(
        description='One of: "food", "beverage", "cosmetic", "pharma", or empty string'
    )
    ingredients: List[str] = Field(
        description="Array of ingredient strings if an ingredient list is visible; empty array otherwise"
    )
    halal_tag: str = Field(
        description="Any halal certificate, haram warning, or certification text visible; empty string if none"
    )


# def _build_llm(api_key: str, max_tokens: int = None) -> ChatFireworks:
#     return ChatFireworks(
#         model="accounts/fireworks/models/kimi-k2p5",
#         fireworks_api_key=api_key,
#         max_tokens=max_tokens,
#     )

settings = get_settings()
FIREWORKS_API_KEY = settings.FIREWORKS_API_KEY

if not FIREWORKS_API_KEY:
    raise ValueError("FIRWORKS API KEY not found!")

llm = ChatFireworks(
    model = "accounts/fireworks/models/kimi-k2p5",
    api_key = FIREWORKS_API_KEY,
)

if not llm:
    raise ValueError("Failed to initialize LLM")

async def analyze_image(base64_image: str, user_prompt: str | None = None) -> str:
    """
    Send a base64 image to the kimi-k2p5 vision model and return the analysis.

    Args:
        base64_image: Full data URI string, e.g. "data:image/jpeg;base64,/9j/..."
        user_prompt:  Optional extra question from the user about the image.

    Returns:
        The model's text response.
    """
    
    final_prompt = (
        f'User Question: "{user_prompt}". '
        "(Remember: Reject if image is not related to Food/Halal/Cosmetics)"
        if user_prompt
        else DEFAULT_USER_PROMPT
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=[
            {"type": "text", "text": final_prompt},
            {"type": "image_url", "image_url": {"url": base64_image}},
        ]),
    ]

    print(f"[VISION] Calling kimi-k2p5 model with user prompt: {final_prompt!r}")
    try:
        response = llm.invoke(messages)
        result = str(response.content)
        print(f"[VISION] Response received ({len(result)} chars)")
        return result
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
    Call the vision model with structured output to extract a product schema.
    Returns a dict with keys: is_relevant, rejection_message, product_name,
    brand, category, ingredients, halal_tag.
    Falls back to _SCHEMA_FALLBACK on any error.
    """
    structured_llm = llm.with_structured_output(ProductSchema, method="json_schema")

    messages = [
        SystemMessage(content="You are a halal compliance analyzer. Extract product information from images accurately."),
        HumanMessage(content=[
            {"type": "text", "text": _SCHEMA_ANALYSIS_PROMPT},
            {"type": "image_url", "image_url": {"url": base64_image}},
        ]),
    ]

    print("[VISION] Extracting product schema from image...")
    try:
        result: ProductSchema = structured_llm.invoke(messages)
        schema = result.model_dump()
        print(
            f"[VISION] Schema parsed: relevant={schema['is_relevant']}, "
            f"product={schema['product_name']!r}, brand={schema['brand']!r}"
        )
        return schema
    except Exception as e:
        print(f"[VISION] Schema error: {e} — using fallback")
        return dict(_SCHEMA_FALLBACK)
