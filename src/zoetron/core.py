"""Zoetron core: the recursive ASI-style loop.

Cycle (each iteration):
  1. ORIENT   - load memory digest relevant to the goal
  2. PLAN     - decompose goal into tasks (LLM)
  3. EXECUTE  - build one artifact per task (LLM), with bounded retries
  4. CRITIQUE - score artifact, remember lessons, iterate or converge
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


@dataclass
class Task:
    title: str
    detail: str = ""
    status: str = "pending"          # pending | done | failed
    attempts: int = 0
    artifact: str = ""
    critique: dict[str, Any] = field(default_factory=dict)


@dataclass
class CycleReport:
    goal: str
    started_at: float
    finished_at: float = 0.0
    cycles_run: int = 0
    offline: bool = True
    tasks: list[Task] = field(default_factory=list)
    score: int = 0
    converged: bool = False
    notes: list[str] = field(default_factory=list)

    def summary(self) -> str:
        done = sum(1 for t in self.tasks if t.status == "done")
        lines = [
            f"Zoetron run '{self.goal[:60]}'",
            f"  mode={('MOCK/offline' if self.offline else 'LIVE')} "
            f"cycles={self.cycles_run} score={self.score}/10 "
            f"tasks_done={done}/{len(self.tasks)} converged={self.converged}",
        ]
        for i, t in enumerate(self.tasks, 1):
            lines.append(f"  {i}. [{t.status:>6}] {t.title}")
            if t.critique.get("issues"):
                for iss in t.critique["issues"][:2]:
                    lines.append(f"       ! {iss}")
        return "\n".join(lines)


class ForgeAgent:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None, max_retries: int = 2):
        self.cfg = cfg
        if llm is None:
            llm, offline = make_llm(cfg)
            self.offline = offline
        else:
            self.offline = False  # injected LLM assumed live (tests inject Mock explicitly)
        self.llm = llm
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        self.max_retries = max_retries

    # ------------------------------------------------------------------ #
    def run(self, goal: str, max_cycles: int = 3) -> CycleReport:
        report = CycleReport(goal=goal, started_at=time.time(), offline=self.offline)
        self.memory.add_event("run_started", {"goal": goal})
        self.memory.remember_fact("last_goal", goal)

        tasks: list[Task] = []
        for cycle in range(1, max_cycles + 1):
            report.cycles_run = cycle
            context = self._orient(goal)
            if not tasks:
                tasks = self._plan(goal, context)
                report.tasks = tasks
            open_tasks = [t for t in tasks if t.status != "done"]
            if not open_tasks:
                break
            for task in open_tasks:
                self._execute(task, goal, context)
            score = self._critique(tasks, goal)
            report.score = score
            if score >= 8:
                report.converged = True
                break
            report.notes.append(f"cycle {cycle}: score {score} < 8 -> iterating")

        report.finished_at = time.time()
        self.memory.add_event("run_finished", {
            "goal": goal, "score": report.score,
            "converged": report.converged, "cycles": report.cycles_run,
        })
        return report

    # -- phases --------------------------------------------------------- #
    def _orient(self, goal: str) -> str:
        """Phase 1: metabolic memory -> compact context block."""
        return self.memory.digest(query=goal)

    def _plan(self, goal: str, context: str) -> list[Task]:
        """Phase 2: decompose into concrete tasks."""
        prompt = (
            "You are the planner of an autonomous forge-agent.\n"
            f"Goal: {goal}\n\n"
            f"Memory context:\n{context}\n\n"
            'Return ONLY JSON: {"tasks": [{"title": str, "detail": str}, ...]} '
            "(3 to 5 tasks, each concrete and verifiable).\n"
            '"task_type": "plan"'
        )
        resp = self.llm.complete([Message("system", PLANNER_SYSTEM),
                                  Message("user", prompt)], temperature=0.2)
        try:
            data = json.loads(_first_json(resp.text))
            return [Task(title=str(t.get("title", ""))[:120],
                         detail=str(t.get("detail", ""))) for t in data.get("tasks", [])][:5]
        except (json.JSONDecodeError, AttributeError):
            return [Task(title=f"Draft deliverable for: {goal}",
                         detail="Fallback single-task plan")]

    def _execute(self, task: Task, goal: str, context: str) -> None:
        """Phase 3: build artifact with bounded retries."""
        while task.attempts <= self.max_retries:
            task.attempts += 1
            prompt = (
                f'Goal: "{goal}"\n'
                '"task_type": "build"\n'
                f'task: "{task.title}"\n'
                f"detail: {task.detail}\n"
                f"attempt: {task.attempts}/{self.max_retries + 1}\n\n"
                f"Memory:\n{context}\n"
                "Produce the artifact now (markdown)."
            )
            try:
                resp = self.llm.complete([Message("user", prompt)], temperature=0.4)
            except Exception:
                continue  # transport error -> consume attempt, retry
            if resp.text.strip():
                task.artifact = resp.text
                task.status = "done"
                self.memory.remember_fact(f"artifact:{task.title[:60]}",
                                          task.artifact[:200], source="builder")
                return
        task.status = "failed"

    def _critique(self, tasks: list[Task], goal: str) -> int:
        """Phase 4: adversarial scoring; failures count against the score."""
        joined = "\n".join(f"## {t.title}\n{t.artifact[:800]}" for t in tasks if t.artifact)
        prompt = (
            f'Goal: "{goal}"\n"task_type": "critique"\n'
            "Judge the artifacts below.\n"
            'Return ONLY JSON: {"score": int 0-10, "issues": [str, ...]}\n\n'
            f"{joined}"
        )
        resp = self.llm.complete(
            [Message("system", CRITIC_SYSTEM), Message("user", prompt)], temperature=0.0)
        issues: list[str] = []
        score = 0
        try:
            data = json.loads(_first_json(resp.text))
            score = max(0, min(10, int(data.get("score", 0))))
            issues = [str(i) for i in data.get("issues", [])][:5]
        except (json.JSONDecodeError, ValueError, AttributeError):
            score = 5
            issues = ["Critic output unparseable."]
        failed = [t.title for t in tasks if t.status == "failed"]
        if failed:
            score = min(score, 3)
            issues.extend(f"task failed: {t}" for t in failed)
        for t in tasks:
            t.critique = {"score": score, "issues": issues}
        self.memory.remember_fact("last_critique",
                                  f"score={score}; issues={'; '.join(issues)[:300]}",
                                  source="critic")
        return score


PLANNER_SYSTEM = ("You are a ruthless planner: few, concrete, verifiable tasks. "
                  "Output raw JSON only.")
CRITIC_SYSTEM = ("You are an adversarial quality critic. Be strict. "
                 "Output raw JSON only.")


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
