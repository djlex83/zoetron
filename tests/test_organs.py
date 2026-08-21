"""Tests for the DRIVE (curiosity) and DREAM (consolidation) organs."""
from pathlib import Path

import pytest

from zoetron.config import Config
from zoetron.drive import Drive
from zoetron.dream import Dream
from zoetron.llm import LLMResponse, Message, MockLLM
from zoetron.memory import MemoryStore


@pytest.fixture()
def mem(tmp_path: Path) -> MemoryStore:
    return MemoryStore(tmp_path / "memory")


def _seed_activity(mem: MemoryStore) -> None:
    mem.add_event("run_started", {"goal": "A"})
    mem.add_event("run_finished", {"goal": "A", "score": 4, "converged": False})
    mem.remember_fact("artifact:alpha", "some content about alpha")
    mem.remember_fact("last_critique", "score=4", source="critic")


def test_drive_generates_goals_offline(mem: MemoryStore, tmp_path: Path):
    cfg = Config(data_dir=tmp_path)
    drive = Drive(cfg, llm=MockLLM(), memory=mem)
    _seed_activity(mem)
    goals = drive.generate_goals(n=3)
    assert len(goals) == 3
    assert all("title" in g and "signal" in g for g in goals)
    kinds = [e["kind"] for e in mem.events()]
    assert kinds.count("drive_goal") == 3


def test_drive_fallback_on_garbage_llm(mem: MemoryStore, tmp_path: Path):
    class GarbageLLM:
        def complete(self, messages, temperature=0.3):
            return LLMResponse(text="no json here at all", model="garbage")

    cfg = Config(data_dir=tmp_path)
    drive = Drive(cfg, llm=GarbageLLM(), memory=mem)
    _seed_activity(mem)
    goals = drive.generate_goals(n=2)
    assert len(goals) == 2                      # deterministic fallback kicked in
    assert all(g["title"] for g in goals)


def test_drive_pick_goal_logs_choice(mem: MemoryStore, tmp_path: Path):
    cfg = Config(data_dir=tmp_path)
    drive = Drive(cfg, llm=MockLLM(), memory=mem)
    _seed_activity(mem)
    chosen = drive.pick_goal()
    assert chosen is not None and chosen.get("title")
    kinds = [e["kind"] for e in mem.events()]
    assert "drive_chosen" in kinds


def test_dream_distills_experience(mem: MemoryStore, tmp_path: Path):
    cfg = Config(data_dir=tmp_path)
    _seed_activity(mem)
    result = Dream(cfg, llm=MockLLM(), memory=mem).sleep(lookback=20)
    assert result["replayed_events"] > 0
    assert len(result["insights"]) == 2         # mock dream returns 2 insights
    dream_facts = [f for f in mem.facts() if f["source"] == "dream"]
    assert len(dream_facts) == 2
    kinds = [e["kind"] for e in mem.events()]
    assert "dream_finished" in kinds
    assert "skill_proposal" in kinds


def test_dream_empty_memory_is_noop(mem: MemoryStore, tmp_path: Path):
    cfg = Config(data_dir=tmp_path)
    result = Dream(cfg, llm=MockLLM(), memory=mem).sleep()
    assert result["insights"] == []
    assert result["replayed_events"] == 0


def test_dream_does_not_refeed_old_dreams(mem: MemoryStore, tmp_path: Path):
    cfg = Config(data_dir=tmp_path)
    _seed_activity(mem)
    dreamer = Dream(cfg, llm=MockLLM(), memory=mem)
    dreamer.sleep()
    replay_second = dreamer._replay(50)
    assert "dream:" not in replay_second        # old insights excluded from replay
