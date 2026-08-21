"""Shared fixtures: isolate tests from the developer's real .env."""
import pytest


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """The repo .env pollutes os.environ at import time - tests must be
    hermetic, so remove provider env vars for every test."""
    for var in ("OPENROUTER_API_KEY", "ZOETRON_API_KEY",
                "ZOETRON_MODEL", "ZOETRON_BASE_URL"):
        monkeypatch.delenv(var, raising=False)
