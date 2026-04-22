from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent

# ── Constants (not env-driven) ──────────────────────────────────────────────
EMBED_MODEL = "accounts/fireworks/models/qwen3-embedding-8b"
VECTOR_SIZE = 4096
SCORE_THRESHOLD = 0.82
TOP_K = 8
FUZZY_THRESHOLD = 0.38
COLLECTION_PRODUCTS = "halal_products"
COLLECTION_ENUMBERS = "halal_enumbers"


class Settings(BaseSettings):
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    FIREWORKS_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    GOOGLE_CX_ID: str = ""
    PRODUCTS_PATH: str = str(BACKEND_DIR / "output" / "canonical_products.json")
    # ENUMBERS_PATH: str = str(BACKEND_DIR / "output" / "e_numbers_lookup.json")
    PORT: int = 8000
    HOST: str = "localhost"

    model_config = {
        "env_file": str(BACKEND_DIR / ".env.local"),
        "extra": "ignore",
        "env_file_encoding": "utf-8",
    }

    def __init__(self, **kwargs):
        import dotenv
        overrides = dotenv.dotenv_values(BACKEND_DIR / ".env.local")
        # .env.local values take priority over system env vars
        for k, v in overrides.items():
            if v is not None and k not in kwargs:
                kwargs[k] = v
        super().__init__(**kwargs)


@lru_cache
def get_settings() -> Settings:
    return Settings()
