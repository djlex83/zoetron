"""Tests for experience-based routing (Erfahrung schlaegt Papier)."""
from pathlib import Path

from zoetron.config import Config
from zoetron.memory import MemoryStore
from zoetron.router import build_chain, experience_boost


def _model(mid: str, ctx: int = 200_000) -> dict:
    return {"id": mid, "context_length": ctx,
            "supported_parameters": ["tools"]}


def test_experience_boost_empty_memory(tmp_path):
    boosts = experience_boost(MemoryStore(tmp_path / "m"))
    assert boosts == {}


def test_experience_boost_scales_scores(tmp_path):
    mem = MemoryStore(tmp_path / "m")
    for score in (10, 10, 10):       # avg 10 -> +5 (capped)
        mem.add_event("model_score", {"model": "good/model", "score": score})
    for score in (0, 0):             # avg 0 -> -5 (capped)
        mem.add_event("model_score", {"model": "bad/model", "score": score})
    boosts = experience_boost(mem)
    assert boosts["good/model"] == 5.0
    assert boosts["bad/model"] == -5.0


def test_experience_beats_metadata_in_chain(tmp_path):
    mem = MemoryStore(tmp_path / "m")
    # paper says: big model ranks higher ...
    big = _model("nvidia/nemotron-3-ultra-550b-a55b:free", 1_000_000)
    small = _model("openai/gpt-oss-20b:free", 131_072)
    # ... but experience says the small one delivers
    for _ in range(4):
        mem.add_event("model_score", {"model": "openai/gpt-oss-20b:free",
                                      "score": 10})
    mem.add_event("model_score", {"model": "nvidia/nemotron-3-ultra-550b-a55b:free",
                                  "score": 1})
    chain = build_chain([big, small], top_n=2,
                        boosts=experience_boost(mem))
    assert chain[0] == "openai/gpt-oss-20b:free"
