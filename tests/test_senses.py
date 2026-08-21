"""Tests for SENSES (external perception organ)."""
import json

from zoetron.config import Config
from zoetron.memory import MemoryStore
from zoetron.senses import Senses


def _senses(tmp_path, fetch):
    return Senses(Config(data_dir=tmp_path),
                  memory=MemoryStore(tmp_path / "memory"), fetch=fetch)


def test_see_frontier_parses_titles(tmp_path):
    hn = json.dumps({"hits": [
        {"title": "Show HN: Zoetron", "url": "https://x.io/1"},
        {"title": "Ask HN: AGI when?", "url": None, "objectID": "42"},
    ]})
    s = _senses(tmp_path, lambda url, **k: hn)
    seen = s.see_frontier()
    assert len(seen) == 2
    assert seen[0]["title"] == "Show HN: Zoetron"
    assert seen[1]["url"].endswith("id=42")  # fallback URL


def test_look_remembers_frontier_facts(tmp_path):
    hn = json.dumps({"hits": [{"title": "Big AI news", "url": "https://a.b"}]})
    s = _senses(tmp_path, lambda url, **k: hn)
    result = s.look()
    assert result["errors"] == []
    facts = [f for f in s.memory.facts() if f["key"].startswith("frontier:")]
    assert len(facts) == 1
    assert "Big AI news" in facts[0]["value"]


def test_look_never_raises_on_network_failure(tmp_path):
    def boom(url, **k):
        raise RuntimeError("network dead")

    s = _senses(tmp_path, boom)
    result = s.look()
    assert result["frontier"] == []
    assert result["errors"] and "frontier" in result["errors"][0]


def test_search_extracts_result_titles(tmp_path):
    ddg_titles = ["Zoetron organism", "  spaced   out  ", "", "third result"]
    s = _senses(tmp_path, lambda url, **k: ddg_titles)
    assert s.search("zoetron") == ["Zoetron organism", "spaced out",
                                   "third result"]


def test_curiosity_goals_from_fresh_frontier(tmp_path):
    hn = json.dumps({"hits": [{"title": "Fresh signal", "url": "https://f.resh"}]})
    s = _senses(tmp_path, lambda url, **k: hn)
    s.look()
    goals = s.curiosity_goals()
    assert goals and goals[0]["title"].startswith("Investigate: Fresh signal")
