"""Tests for METABOLISM (stress axis / appetite control)."""
import time

from zoetron.config import Config
from zoetron.memory import MemoryStore
from zoetron.metabolism import Metabolism


def _met(tmp_path) -> Metabolism:
    return Metabolism(Config(data_dir=tmp_path),
                      memory=MemoryStore(tmp_path / "memory"))


def test_relaxed_organism_has_full_appetite(tmp_path):
    met = _met(tmp_path)
    assert met.state() == "full"
    b = met.plan_budget()
    assert b == {"max_tasks": 5, "max_iterations": 2}


def test_failures_raise_stress(tmp_path):
    met = _met(tmp_path)
    for _ in range(3):
        met.memory.add_event("model_fail", {"model": "x", "error": "boom"})
    assert met.stress_level() > 0.3
    assert met.state() in ("moderate", "conserve")


def test_stress_decays_over_time(tmp_path):
    met = _met(tmp_path)
    met.memory.add_event("timeout", {"where": "run"})
    # fake age: rewrite the event's ts to 12h ago
    ev_path = tmp_path / "memory" / "events.jsonl"
    import json
    lines = [json.loads(l) for l in ev_path.read_text().splitlines() if l]
    for e in lines:
        if e["kind"] == "timeout":
            e["ts"] -= 12 * 3600
    ev_path.write_text("\n".join(json.dumps(e) for e in lines) + "\n")
    assert met.stress_level() < 0.2


def test_conserve_state_shrinks_plan(tmp_path):
    met = _met(tmp_path)
    for _ in range(6):
        met.memory.add_event("timeout", {"where": "run"})
    assert met.state() == "conserve"
    assert met.plan_budget() == {"max_tasks": 3, "max_iterations": 1}
    tasks = [f"t{i}" for i in range(5)]
    assert len(met.apply_to_plan(tasks)) == 3


def test_log_state_writes_event(tmp_path):
    met = _met(tmp_path)
    met.log_state()
    kinds = [e["kind"] for e in met.memory.events()]
    assert "metabolism_check" in kinds
