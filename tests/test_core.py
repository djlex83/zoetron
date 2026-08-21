"""Tests for the Zoetron core loop (fully offline via MockLLM)."""
from pathlib import Path

import pytest

from zoetron.config import Config
from zoetron.core import ForgeAgent
from zoetron.llm import MockLLM
from zoetron.memory import MemoryStore


@pytest.fixture()
def agent(tmp_path: Path) -> ForgeAgent:
    cfg = Config(data_dir=tmp_path)
    mem = MemoryStore(tmp_path / "memory")
    return ForgeAgent(cfg, llm=MockLLM(), memory=mem)


def test_run_converges_offline(agent: ForgeAgent):
    report = agent.run("Build a niche research digest about AI agents", max_cycles=3)
    assert report.cycles_run >= 1
    assert len(report.tasks) == 3          # mock planner returns 3 tasks
    assert all(t.status == "done" for t in report.tasks)
    assert report.converged is True        # mock critic scores 9 when no issues
    assert report.score >= 8


def test_memory_persists_across_runs(agent: ForgeAgent, tmp_path: Path):
    agent.run("First goal", max_cycles=1)
    second = ForgeAgent(agent.cfg, llm=MockLLM(),
                        memory=MemoryStore(tmp_path / "memory"))
    second.run("Second goal", max_cycles=1)
    facts = second.memory.facts()
    keys = [f["key"] for f in facts]
    # both runs recorded their goal; run 1's artifacts persist into run 2
    assert keys.count("last_goal") == 2
    assert any(k.startswith("artifact:") for k in keys)


def test_plan_prompt_contains_marker():
    from zoetron.llm import Message, MockLLM
    mock = MockLLM()
    resp = mock.complete([Message("user",
                                  'Goal: test\n"task_type": "plan"\n')])
    assert '"tasks"' in resp.text


def test_critic_failure_penalty(agent: ForgeAgent):
    class FailingLLM(MockLLM):
        def complete(self, messages, temperature=0.3):  # noqa: D102
            from zoetron.llm import LLMResponse
            return LLMResponse(text="", model="broken")

    broken = ForgeAgent(agent.cfg, llm=FailingLLM(), memory=agent.memory, max_retries=1)
    report = broken.run("Something", max_cycles=1)
    assert all(t.status == "failed" for t in report.tasks)
    assert report.score <= 3               # adversarial critic caps failures
