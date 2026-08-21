"""Tests for the SIMULATE world-model organ."""
from pathlib import Path

from zoetron.config import Config
from zoetron.llm import MockLLM, LLMResponse, Message
from zoetron.memory import MemoryStore
from zoetron.simulate import Simulate, apply_revisions


class _Task:
    """Minimal duck-typed task for apply_revisions."""

    def __init__(self, title: str, detail: str = ""):
        self.title = title
        self.detail = detail


def _sim(tmp_path: Path) -> Simulate:
    return Simulate(Config(data_dir=tmp_path), llm=MockLLM(),
                    memory=MemoryStore(tmp_path / "memory"))


def test_dry_run_returns_go_with_mock(tmp_path):
    result = _sim(tmp_path).dry_run("goal", [{"title": "A", "detail": ""}])
    assert result["verdict"] == "go"
    assert isinstance(result["risks"], list)


def test_dry_run_logs_simulation_event(tmp_path):
    mem = MemoryStore(tmp_path / "memory")
    Simulate(Config(data_dir=tmp_path), llm=MockLLM(), memory=mem).dry_run(
        "g", [{"title": "t", "detail": ""}])
    kinds = [e["kind"] for e in mem.events()]
    assert "simulation" in kinds


def test_garbage_llm_falls_back_to_go(tmp_path):
    class Garbage:
        def complete(self, messages, temperature=0.3):
            return LLMResponse(text="no json", model="x")

    result = Simulate(Config(data_dir=tmp_path), llm=Garbage(),
                      memory=MemoryStore(tmp_path / "memory")).dry_run(
        "g", [{"title": "t", "detail": ""}])
    assert result["verdict"] == "go" and not result["revisions"]


def test_apply_revisions_matches_titles():
    tasks = [_Task("Research the market"), _Task("Build prototype")]
    applied = apply_revisions(
        tasks,
        [{"task": "research", "change": "check memory first"}])
    assert applied == 1
    assert "SIMULATION-FIX" in tasks[0].detail
    assert tasks[1].detail == ""


def test_failure_digest_lists_unconverged_runs(tmp_path):
    mem = MemoryStore(tmp_path / "memory")
    mem.add_event("run_finished", {"goal": "bad goal", "score": 3,
                                   "converged": False})
    digest = Simulate(Config(data_dir=tmp_path), llm=MockLLM(),
                      memory=mem)._failure_digest()
    assert "bad goal" in digest
