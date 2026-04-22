CATEGORY_MAP: dict[str, str] = {
    # Food
    "food": "Food",
    "foods": "Food",
    "meat": "Food",
    "chicken": "Food",
    "dairy": "Food",
    "cheese": "Food",
    "snack": "Food",
    "snacks": "Food",
    "chocolate": "Food",
    "chips": "Food",
    "biscuit": "Food",
    "bread": "Food",
    "seafood": "Food",
    "fish": "Food",
    "candy": "Food",
    # Beverage
    "drink": "Beverage",
    "drinks": "Beverage",
    "juice": "Beverage",
    "beverage": "Beverage",
    "beverages": "Beverage",
    "water": "Beverage",
    "coffee": "Beverage",
    "tea": "Beverage",
    # Pharma
    "medicine": "Pharma",
    "medicines": "Pharma",
    "supplement": "Pharma",
    "supplements": "Pharma",
    "vitamin": "Pharma",
    "vitamins": "Pharma",
    "capsule": "Pharma",
    "pharmaceutical": "Pharma",
    "health": "Pharma",
    "herbal": "Pharma",
    "tablet": "Pharma",
    # Cosmetic
    "cosmetic": "Cosmetic",
    "cosmetics": "Cosmetic",
    "skincare": "Cosmetic",
    "skin care": "Cosmetic",
    "lotion": "Cosmetic",
    "shampoo": "Cosmetic",
    "soap": "Cosmetic",
    "perfume": "Cosmetic",
    "fragrance": "Cosmetic",
    "beauty": "Cosmetic",
    "makeup": "Cosmetic",
    "haircare": "Cosmetic",
    "hair": "Cosmetic",
    # Additive
    "additive": "Additive",
    "additives": "Additive",
    "flavoring": "Additive",
    "preservative": "Additive",
}

CANONICAL_CATEGORIES = [
    "Food",
    "Beverage",
    "Additive",
    "Cosmetic",
    "Pharma",
    "Non-food",
    "Service",
]


def resolve_category(raw: str | None) -> str | None:
    if not raw:
        return None
    r = raw.lower()
    for c in CANONICAL_CATEGORIES:
        if r == c.lower():
            return c
    for k, v in CATEGORY_MAP.items():
        if k in r:
            return v
    return None
