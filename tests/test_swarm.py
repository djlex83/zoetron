"""Tests for the multi-agent swarm mode (offline)."""
from pathlib import Path

import pytest

from zoetron.config import Config
from zoetron.llm import MockLLM
from zoetron.memory import MemoryStore
from zoetron.swarm import ROLE_PROMPTS, RoleAgent, SwarmOrchestrator


@pytest.fixture()
def swarm(tmp_path: Path) -> SwarmOrchestrator:
    cfg = Config(data_dir=tmp_path)
    mem = MemoryStore(tmp_path / "memory")

    orch = SwarmOrchestrator(cfg=cfg, memory=mem)
    # force every role onto its OWN mock instance -> proves role separation
    for role, agent in orch.roles.items():
        agent.llm = MockLLM()
    return orch


def test_swarm_roles_are_separate_instances(swarm: SwarmOrchestrator):
    assert set(swarm.roles) == {"planner", "builder", "critic"}
    assert swarm.roles["planner"] is not swarm.roles["critic"]
    assert swarm.roles["planner"].model_name != ""


def test_swarm_run_produces_report(swarm: SwarmOrchestrator):
    report = swarm.run("Build a niche AI market-gap analysis", max_cycles=1)
    assert report["mode"] == "offline"
    assert len(report["tasks"]) == 3
    assert all(t["status"] == "done" for t in report["tasks"])
    assert report["score"] >= 8
    # every role was actually consulted
    assert report["role_calls"]["planner"] >= 1
    assert report["role_calls"]["builder"] >= 3
    assert report["role_calls"]["critic"] >= 1


def test_role_prompts_exist_for_all_roles():
    assert set(ROLE_PROMPTS) == {"planner", "builder", "critic"}
    for prompt in ROLE_PROMPTS.values():
        assert "JSON" in prompt or "artifact" in prompt.lower()


def test_roleagent_counts_calls(tmp_path: Path):
    agent = RoleAgent(role="planner", llm=MockLLM())
    agent.ask('Goal: x\n"task_type": "plan"')
    agent.ask('Goal: y\n"task_type": "plan"')
    assert agent.calls == 2
