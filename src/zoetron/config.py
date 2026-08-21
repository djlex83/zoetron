"""Zoetron configuration.

Secrets come ONLY from environment variables or the repo-local `.env`
(never hardcoded):
  ZOETRON_API_KEY   or  OPENROUTER_API_KEY
  ZOETRON_MODEL     (model slug, e.g. stealth/ox-alpha on OpenRouter)
  ZOETRON_BASE_URL  (default: https://openrouter.ai/api/v1)
  ZOETRON_DATA_DIR  (default: <repo>/data)
"""
from __future__ import annotations

import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "mock"  # offline deterministic brain until a real key is set

_REPO_ROOT = Path(__file__).resolve().parents[2]


def _load_env_file() -> None:
    """Tiny dotenv loader: fills MISSING os.environ entries from repo .env.

    Real environment variables always win over the file.
    """
    env_file = _REPO_ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip().removeprefix("export ").strip()
        value = value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


_load_env_file()


def _read_api_key() -> str:
    """ZOETRON_API_KEY wins, then OPENROUTER_API_KEY."""
    return os.environ.get("ZOETRON_API_KEY", "") or os.environ.get("OPENROUTER_API_KEY", "")


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ZOETRON_", extra="ignore", frozen=True
    )

    api_key: str = Field(default_factory=_read_api_key)
    base_url: str = Field(
        default_factory=lambda: os.environ.get("ZOETRON_BASE_URL", DEFAULT_BASE_URL)
    )
    model: str = Field(
        default_factory=lambda: os.environ.get("ZOETRON_MODEL", DEFAULT_MODEL)
    )
    data_dir: Path = Field(
        default_factory=lambda: Path(
            os.environ.get("ZOETRON_DATA_DIR", str(_REPO_ROOT / "data"))
        )
    )

    @property
    def offline(self) -> bool:
        """True when no API key/model configured -> deterministic MockLLM."""
        return not self.api_key or self.model in ("", "mock")
