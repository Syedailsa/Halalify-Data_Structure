from __future__ import annotations

from typing import List

from config import get_settings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_fireworks import ChatFireworks
from pydantic import BaseModel, Field


_SCHEMA_ANALYSIS_PROMPT = (
    "Analyze this image for halal compliance. "
    "Determine if it shows a consumer product (food, beverage, cosmetic, pharmaceutical). "
    "Extract all visible product information including but not limited to halal status, product name and company/brand name. "
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
