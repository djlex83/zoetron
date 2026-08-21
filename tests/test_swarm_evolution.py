"""Tests for EVOLUTION <-> SWARM coupling (fail -> evolve -> inherit)."""
import json

from zoetron.config import Config
from zoetron.llm import LLMResponse, Message
from zoetron.memory import MemoryStore
from zoetron.swarm import SwarmOrchestrator


class _LowCriticHighEvo:
    """Critic always fails the run (score 4); evolution works normally."""

    def complete(self, messages, temperature=0.3):
        text = messages[-1].content if messages else ""
        if '"task_type": "critique"' in text:
            return LLMResponse(text=json.dumps({"score": 4,
                                                "issues": ["too shallow"]}),
                               model="fake-critic")
        if '"task_type": "evolve"' in text:
            return LLMResponse(text=json.dumps({"variants": [
                {"angle": "radical", "solution": "flip the approach"},
            ]}), model="fake-evo")
        if '"task_type": "select"' in text:
            return LLMResponse(text=json.dumps({
                "scores": [7], "winner": 0, "reason": "only one"}), model="x")
        if '"task_type": "goals"' in text or _is_plan(text):
            return LLMResponse(text=json.dumps(
                {"tasks": [{"title": "Step", "detail": "do it"}]}
                if _is_plan(text) else {"goals": []}), model="fake")
        return LLMResponse(text=json.dumps(
            {"title": "T", "body": "B", "verdict": "pass"}), model="fake")


def _is_plan(prompt: str) -> bool:
    return '"tasks"' in prompt and "Return ONLY JSON" in prompt


def _orchestrator(tmp_path, llm=None) -> SwarmOrchestrator:
    cfg = Config(data_dir=tmp_path)
    mem = MemoryStore(tmp_path / "memory")
    llm = llm or _LowCriticHighEvo()
    return SwarmOrchestrator(cfg, memory=mem,
                             planner_llm=llm, builder_llm=llm,
                             critic_llm=llm)


def test_failed_run_triggers_evolution_and_stores_strategy(tmp_path):
    orch = _orchestrator(tmp_path)
    report = orch.run("build a rocket", max_cycles=1)
    assert report["converged"] is False
    assert report["evolution"]["winner_angle"] == "radical"
    strategies = [f for f in orch.memory.facts()
                  if f["key"].startswith("strategy:")]
    assert strategies and "radical" in strategies[0]["value"]
    kinds = [e["kind"] for e in orch.memory.events()]
    assert "evolution_run" in kinds


def test_next_run_inherits_winning_strategies(tmp_path):
    orch = _orchestrator(tmp_path)
    orch.run("first goal", max_cycles=1)
    inherited = orch._inherit_strategies()
    assert "Winning strategies" in inherited
    assert "flip the approach" in inherited or "radical" in inherited


def test_converged_run_skips_evolution(tmp_path):
    class AlwaysPass(_LowCriticHighEvo):
        def complete(self, messages, temperature=0.3):
            resp = super().complete(messages, temperature)
            text = messages[-1].content
            if '"task_type": "critique"' in text:
                return LLMResponse(text=json.dumps(
                    {"score": 9, "issues": []}), model="fake-critic")
            return resp

    cfg = Config(data_dir=tmp_path)
    mem = MemoryStore(tmp_path / "memory")
    llm = AlwaysPass()
    report = SwarmOrchestrator(cfg, memory=mem, planner_llm=llm,
                               builder_llm=llm, critic_llm=llm).run(
        "easy goal", max_cycles=2)
    assert report["converged"] is True
    assert report["evolution"] is None
    assert not [f for f in mem.facts() if f["key"].startswith("strategy:")]
