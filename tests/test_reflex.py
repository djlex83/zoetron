"""Tests for REFLEX (spinal-cord level self-healing)."""
import json

from zoetron.config import Config
from zoetron.memory import MemoryStore
from zoetron import reflex


def test_fixes_node20_deprecation(tmp_path, monkeypatch):
    wf = tmp_path / "workflows"
    wf.mkdir()
    (wf / "ci.yml").write_text(
        "steps:\n  - uses: actions/checkout@v4\n"
        "  - uses: actions/setup-python@v5\n")
    monkeypatch.setattr(reflex, "WF", wf)
    result = reflex._fix_ci_node_deprecation()
    assert result and result["fixed"] == ["ci.yml"]
    text = (wf / "ci.yml").read_text()
    assert "actions/checkout@v5" in text
    assert "actions/setup-python@v6" in text


def test_no_change_when_already_current(tmp_path, monkeypatch):
    wf = tmp_path / "workflows"
    wf.mkdir()
    (wf / "ci.yml").write_text("  - uses: actions/checkout@v5\n")
    monkeypatch.setattr(reflex, "WF", wf)
    assert reflex._fix_ci_node_deprecation() is None


def test_run_reflexes_logs_event(tmp_path, monkeypatch):
    mem = tmp_path / "memory"
    mem.mkdir()
    (mem / "events.jsonl").write_text("")
    monkeypatch.setattr(reflex, "EVENTS", mem / "events.jsonl")
    monkeypatch.setattr(reflex, "WF", tmp_path / "missing")
    monkeypatch.setattr(reflex, "check_ci_status_via_api",
                        lambda: None)
    out = reflex.run_reflexes()
    assert out["repairs"] == []
    events = [json.loads(l)
              for l in (mem / "events.jsonl").read_text().splitlines()]
    assert events[-1]["kind"] == "reflex_ok"
