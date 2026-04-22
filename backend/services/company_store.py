from __future__ import annotations

import json
import os

from Levenshtein import distance as lev_distance

from config import FUZZY_THRESHOLD


class CompanyStore:
    def __init__(self) -> None:
        self.companies: list[dict] = []  # [{raw, norm}]
        self.is_initialized: bool = False

    def load(self, products_path: str) -> bool:
        if not os.path.exists(products_path):
            print(f"\n  canonical_products.json not found at:\n     {products_path}")
            print(
                "  Add PRODUCTS_PATH=C:\\path\\to\\canonical_products.json to your .env.local\n"
            )
            return False

        with open(products_path, "r", encoding="utf-8") as f:
            products = json.load(f)

        seen: set[str] = set()
        for r in products:
            for c in r.get("companies") or []:
                if c and c.lower() not in seen:
                    seen.add(c.lower())
                    self.companies.append({"raw": c, "norm": c.lower()})

        self.is_initialized = True
        return True

    def fuzzy_match(
        self, token: str, threshold: float = FUZZY_THRESHOLD
    ) -> dict | None:
        if not token or not self.companies:
            return None

        t = token.lower()
        best: dict | None = None
        best_dist = float("inf")

        for c in self.companies:
            # Substring containment — prefer shorter norm
            if c["norm"] in t or t in c["norm"]:
                if len(c["norm"]) < (len(best["norm"]) if best else float("inf")):
                    best = c
                    best_dist = 0

            # Levenshtein distance (normalized)
            d = lev_distance(t, c["norm"]) / max(len(t), len(c["norm"]))
            if d < best_dist:
                best_dist = d
                best = c

        if best_dist <= threshold and best is not None:
            return {"matched": best["raw"], "dist": best_dist}
        return None
