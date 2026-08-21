"""Tests for METACOG (self-model / calibration organ)."""
from pathlib import Path

import pytest

from zoetron.config import Config
from zoetron.llm import MockLLM
from zoetron.memory import MemoryStore
from zoetron.metacog import MetaCog


@pytest.fixture()
def mem(tmp_path: Path) -> MemoryStore:
    return MemoryStore(tmp_path / "memory")


def _metacog(mem: MemoryStore, tmp_path: Path) -> MetaCog:
    return MetaCog(Config(data_dir=tmp_path), llm=MockLLM(), memory=mem)


def test_predict_returns_clamped_score(mem: MemoryStore, tmp_path: Path):
    mc = _metacog(mem, tmp_path)
    score = mc.predict_score("Build X", ["task 1", "task 2"])
    assert 0 <= score <= 10


def test_calibrate_records_error(mem: MemoryStore, tmp_path: Path):
    mc = _metacog(mem, tmp_path)
    err = mc.calibrate(predicted=7, actual=4, goal="demo")
    assert err == 3
    events = mem.events(kind="calibration")
    assert len(events) == 1
    assert events[0]["payload"]["abs_error"] == 3


def test_self_model_empty_memory(mem: MemoryStore, tmp_path: Path):
    mc = _metacog(mem, tmp_path)
    model = mc.self_model()
    assert model["n"] == 0


def test_self_model_aggregates_and_trend(mem: MemoryStore, tmp_path: Path):
    mc = _metacog(mem, tmp_path)
    # early runs: bad calibration (error 5), later runs: good (error 1)
    for p, a in [(9, 4), (8, 3)]:
        mc.calibrate(p, a, "early")
    for p, a in [(6, 5), (7, 7), (5, 6)]:
        mc.calibrate(p, a, "late")
    model = mc.self_model()
    assert model["n"] == 5
    assert model["trend"] == "improving"
    assert model["recent_mean_abs_error"] < model["mean_abs_error"]
    assert model["overconfident_runs"] >= 2


def test_history_summary_feeds_back_into_prompts(mem: MemoryStore, tmp_path: Path):
    mc = _metacog(mem, tmp_path)
    mc.calibrate(9, 3, "past run")
    summary = mc._history_summary()
    assert "pred=9" in summary and "actual=3" in summary
