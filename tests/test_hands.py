"""Tests for HANDS (motor organ: real code execution)."""
import json

from zoetron.config import Config
from zoetron.hands import Hands
from zoetron.llm import LLMResponse, Message, MockLLM
from zoetron.memory import MemoryStore


def _hands(tmp_path, llm=None) -> Hands:
    return Hands(Config(data_dir=tmp_path), llm=llm or MockLLM(),
                 memory=MemoryStore(tmp_path / "memory"),
                 sandbox=tmp_path / "sandbox")


def test_execute_runs_real_code(tmp_path):
    h = _hands(tmp_path)
    r = h.execute("print(2 + 3)")
    assert r["ok"] is True and "5" in r["stdout"]


def test_execute_captures_errors(tmp_path):
    h = _hands(tmp_path)
    r = h.execute("raise ValueError('kaputt')")
    assert r["ok"] is False and "kaputt" in r["stderr"]


def test_forbidden_pattern_blocked(tmp_path):
    h = _hands(tmp_path)
    r = h.execute("import os; os.system('rm -rf /')")
    assert r["ok"] is False and "forbidden" in r["error"]
    kinds = [e["kind"] for e in h.memory.events()]
    assert "hand_action" in kinds


def test_timeout_is_contained(tmp_path):
    h = _hands(tmp_path)
    r = h.execute("while True: pass", timeout=2.0)
    assert r["ok"] is False and "timeout" in r["error"]


class _Coder:
    """Fake LLM that plans a working program."""

    def complete(self, messages, temperature=0.3):
        return LLMResponse(text=json.dumps({
            "code": "print('hello from hands')",
            "explanation": "prints a greeting",
        }), model="fake")


def test_do_task_closes_loop(tmp_path):
    h = _hands(tmp_path, llm=_Coder())
    out = h.do_task("greet the world")
    assert out["ok"] is True and "hello" in out["stdout"]
    kinds = [e["kind"] for e in h.memory.events()]
    assert "hand_task" in kinds


def test_do_task_survives_bad_planner(tmp_path):
    class Garbage:
        def complete(self, messages, temperature=0.3):
            return LLMResponse(text="no json here", model="x")

    out = _hands(tmp_path, llm=Garbage()).do_task("anything")
    assert out["ok"] is False and "planner" in out["error"]
