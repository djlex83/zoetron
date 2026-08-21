"""Provider layer: one interface, two brains.

- OpenAICompatLLM : talks to any OpenAI-compatible endpoint (OpenRouter first).
- MockLLM         : deterministic offline brain so the whole loop is testable
                    without keys/network.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


@dataclass
class Message:
    role: str
    content: str


@dataclass
class LLMResponse:
    text: str
    model: str
    usage: dict[str, int] = field(default_factory=dict)


class LLM(Protocol):
    def complete(self, messages: list[Message], temperature: float = 0.3) -> LLMResponse: ...


class OpenAICompatLLM:
    """Minimal client for OpenRouter / any OpenAI-compatible chat endpoint."""

    def __init__(self, api_key: str, base_url: str, model: str, timeout: float = 120.0):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def complete(self, messages: list[Message], temperature: float = 0.3) -> LLMResponse:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://github.com/zoetron",
            "X-Title": "Zoetron",
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            error = (data.get("error") or {})
            raise RuntimeError(
                f"endpoint returned no choices "
                f"(status {resp.status_code}): {str(error)[:200] or data}")
        choice = choices[0]["message"]["content"]
        return LLMResponse(text=choice or "", model=data.get("model", self.model),
                           usage=data.get("usage") or {})


# --------------------------------------------------------------------------- #
# Offline brain                                                                #
# --------------------------------------------------------------------------- #

_PLAN_HINT = '"task_type": "plan"'
_BUILD_HINT = '"task_type": "build"'
_CRITIC_HINT = '"task_type": "critique"'
_GOALS_HINT = '"task_type": "goals"'
_CONSOLIDATE_HINT = '"task_type": "consolidate"'
_PREDICT_HINT = '"task_type": "predict"'
_SIMULATE_HINT = '"task_type": "simulate"'


class MockLLM:
    """Deterministic stand-in so CI/tests/demo run fully offline."""

    def __init__(self) -> None:
        self.calls = 0

    def complete(self, messages: list[Message], temperature: float = 0.3) -> LLMResponse:
        self.calls += 1
        prompt = "\n".join(m.content for m in messages)

        if _PLAN_HINT in prompt:
            topic = _extract_goal(prompt) or "the goal"
            tasks = [
                {"title": f"Research: state of the art for {topic}", "detail":
                 "Collect 3 existing approaches, note their weakest link."},
                {"title": f"Differentiate: what is missing for {topic}", "detail":
                 "Define the unique wedge nobody covers."},
                {"title": f"Prototype: minimal artifact for {topic}", "detail":
                 "Produce a concrete deliverable (doc/schema/code skeleton)."},
            ]
            return LLMResponse(text=json.dumps({"tasks": tasks}), model="mock-planner")

        if _CRITIC_HINT in prompt:
            issues: list[str] = []
            if len(prompt.strip()) < 80:
                issues.append("Artifact too short to be useful.")
            if "TODO" in prompt:
                issues.append("Unresolved TODO found.")
            score = 9 if not issues else 5
            return LLMResponse(text=json.dumps({"score": score, "issues": issues}),
                               model="mock-critic")

        if _GOALS_HINT in prompt:
            goals = [
                {"title": "Explore unknown territory", "why":
                 "Memory shows few events in this area; high information gain."},
                {"title": "Test a capability limit", "why":
                 "Calibration data is thin; probing limits sharpens self-knowledge."},
                {"title": "Connect two distant memories", "why":
                 "Novel combinations often yield the biggest insights."},
            ]
            return LLMResponse(text=json.dumps({"goals": goals}), model="mock-drive")

        if _CONSOLIDATE_HINT in prompt:
            return LLMResponse(
                text=json.dumps({
                    "insights": [
                        "Recurring theme across events: planning quality dominates outcomes.",
                        "Failed tasks cluster around missing context, not wrong logic.",
                    ],
                    "skill_proposals": [
                        "Before building, check memory for prior artifacts on the same topic.",
                    ],
                }),
                model="mock-dream")

        if _PREDICT_HINT in prompt:
            return LLMResponse(text=json.dumps({"predicted_score": 7}),
                               model="mock-metacog")

        if _SIMULATE_HINT in prompt:
            return LLMResponse(
                text=json.dumps({
                    "verdict": "go", "risks": [],
                    "revisions": [{"task": "Research",
                                   "change": "Cross-check against memory artifacts first."}],
                }),
                model="mock-simulate")

        if _BUILD_HINT in prompt:
            task = _extract_field(prompt, "task") or "the task"
            body = (
                f"# Artifact: {task}\n\n"
                f"## Approach\nDeterministic offline draft produced by MockLLM.\n\n"
                f"## Key decisions\n- Scope kept minimal and verifiable.\n"
                f"- Interfaces documented inline.\n\n## Next steps\n- Replace mock "
                f"brain with a live model to enrich this artifact."
            )
            return LLMResponse(text=body, model="mock-builder")

        return LLMResponse(text="OK (mock)", model="mock")


def _extract_goal(prompt: str) -> str | None:
    for line in prompt.splitlines():
        if line.lower().startswith("goal:"):
            return line.split(":", 1)[1].strip()
    return None


def _extract_field(prompt: str, field_name: str) -> str | None:
    marker = f'"{field_name}":'
    if marker in prompt:
        tail = prompt.split(marker, 1)[1]
        return tail.split('"', 2)[1] if '"' in tail else None
    return None


def make_llm(cfg) -> tuple[Any, bool]:
    """Factory -> (llm, offline_flag).

    ZOETRON_MODEL=auto activates the AutoRouter: discovers all free
    tool-capable models, ranks them, and fails over automatically.
    """
    if cfg.offline:
        return MockLLM(), True
    if cfg.model == "auto":
        from .router import ResilientLLM, auto_chain
        chain = auto_chain(cfg)
        if not chain:
            raise RuntimeError("auto: no free tool-capable models discovered")
        return ResilientLLM(cfg, chain), False
    return OpenAICompatLLM(cfg.api_key, cfg.base_url, cfg.model), False
