"""Tests for EVOLUTION (variation, selection, heredity)."""
import json

from zoetron.config import Config
from zoetron.evolution import Evolution
from zoetron.llm import LLMResponse, Message, MockLLM
from zoetron.memory import MemoryStore


class _EvoLLM:
    """Fake brain: varies on high temp, selects deterministically."""

    def complete(self, messages, temperature=0.3):
        text = messages[-1].content
        if "evolve" in text:
            return LLMResponse(text=json.dumps({"variants": [
                {"angle": "fast", "solution": "use a cache"},
                {"angle": "simple", "solution": "do less work"},
                {"angle": "parallel", "solution": "split the load"},
            ]}), model="fake")
        return LLMResponse(text=json.dumps({
            "scores": [8, 6, 9], "winner": 2, "reason": "scales best",
        }), model="fake")


def _evo(tmp_path) -> Evolution:
    return Evolution(Config(data_dir=tmp_path), llm=_EvoLLM(),
                     memory=MemoryStore(tmp_path / "memory"))


def test_vary_produces_distinct_variants(tmp_path):
    variants = _evo(tmp_path).vary("speed up imports", n=3)
    assert len(variants) == 3
    assert {v["angle"] for v in variants} == {"fast", "simple", "parallel"}


def test_select_picks_winner_with_score(tmp_path):
    evo = _evo(tmp_path)
    variants = evo.vary("p", n=3)
    outcome = evo.select("p", variants)
    assert outcome["index"] == 2
    assert outcome["scores"] == [8, 6, 9]


def test_evolve_full_cycle_records_lineage(tmp_path):
    evo = _evo(tmp_path)
    result = evo.evolve("make memory faster", n=3)
    assert result["variants"] == 3
    assert result["score"] == 9  # winner's score
    ev = [e for e in evo.memory.events() if e["kind"] == "evolution_run"]
    assert len(ev) == 1 and ev[0]["payload"]["winner_index"] == 2


def test_evolve_never_raises_on_garbage(tmp_path):
    class Garbage:
        def complete(self, messages, temperature=0.3):
            return LLMResponse(text="no json", model="x")

    result = Evolution(Config(data_dir=tmp_path), llm=Garbage(),
                       memory=MemoryStore(tmp_path / "memory")
                       ).evolve("anything")
    assert result["variants"] == 0


def test_mock_still_works_offline(tmp_path):
    from zoetron.config import Config as C
    llm, offline = __import__("zoetron.llm", fromlist=["make_llm"]).make_llm(
        C(data_dir=tmp_path))
    assert offline
