"""Multi-agent swarm mode: Planner, Builder, Critic as separate role agents.

Each RoleAgent wraps its own LLM instance + system prompt and logs every
exchange to the shared JSONL blackboard (MemoryStore). A SwarmOrchestrator
runs the same orient->plan->execute->critique cycle as the single-agent
core, but consults the roles through their own channels.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore

ROLE_PROMPTS: dict[str, str] = {
    "planner": (
        "You are PLANNER of an autonomous forge swarm. Ruthless strategist: "
        "decompose goals into 3-5 concrete, verifiable tasks. Output raw JSON only."
    ),
    "builder": (
        "You are BUILDER of an autonomous forge swarm. Craftsman: produce exactly "
        "one artifact per task (markdown/code), no meta commentary."
    ),
    "critic": (
        "You are CRITIC of an autonomous forge swarm. Adversarial quality gate: "
        "be strict. Output raw JSON only."
    ),
}


class RoleAgent:
    """One role = one LLM channel with its own system prompt + call counter."""

    def __init__(self, role: str, llm: LLM | None, model_name: str = "",
                 system_prompt: str | None = None):
        self.role = role
        self.llm = llm
        self.model_name = model_name or ("mock" if llm is None else "inherited")
        self.system_prompt = system_prompt or ROLE_PROMPTS[role]
        self.calls = 0
        self.last_error: str | None = None
        self.backend = "unknown"  # set to mock|live on first ask()

    def ask(self, user_prompt: str, temperature: float = 0.3) -> str:
        if self.llm is None:  # lazy default (offline mock)
            self.llm = make_llm(Config())[0]
        from .llm import MockLLM
        self.backend = "mock" if isinstance(self.llm, MockLLM) else "live"
        self.calls += 1
        try:
            resp = self.llm.complete(
                [Message("system", self.system_prompt), Message("user", user_prompt)],
                temperature=temperature,
            )
        except Exception as exc:  # network/timeouts must not kill the swarm
            self.last_error = f"{type(exc).__name__}: {exc}"
            return ""
        return resp.text


@dataclass
class SwarmTask:
    title: str
    detail: str = ""
    status: str = "pending"
    attempts: int = 0
    artifact: str = ""


class SwarmOrchestrator:
    def __init__(self, cfg: Config, memory: MemoryStore | None = None,
                 planner_llm: LLM | None = None, builder_llm: LLM | None = None,
                 critic_llm: LLM | None = None, max_retries: int = 2):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        self.max_retries = max_retries
        self.roles: dict[str, RoleAgent] = {
            "planner": RoleAgent("planner", planner_llm),
            "builder": RoleAgent("builder", builder_llm),
            "critic": RoleAgent("critic", critic_llm),
        }

    # ------------------------------------------------------------------ #
    def run(self, goal: str, max_cycles: int = 3) -> dict[str, Any]:
        started = time.time()
        self.memory.add_event("swarm_started", {"goal": goal})
        self.memory.remember_fact("last_swarm_goal", goal)

        role_calls = {r: 0 for r in self.roles}
        tasks: list[SwarmTask] = []
        score = 0
        issues: list[str] = []
        converged = False
        cycles_used = 0

        for cycle in range(1, max_cycles + 1):
            cycles_used = cycle
            context = self._orient(goal)

            if not tasks:
                tasks = self._plan(goal, context)
                role_calls["planner"] += self.roles["planner"].calls

            from .metacog import MetaCog
            metacog = MetaCog(self.cfg, memory=self.memory)
            predicted = metacog.predict_score(goal, [t.title for t in tasks])

            from .simulate import Simulate, apply_revisions
            sim = Simulate(self.cfg, memory=self.memory)
            sim_result = sim.dry_run(goal, [{"title": t.title, "detail": t.detail}
                                            for t in tasks])
            if sim_result["verdict"] == "revise" and sim_result["revisions"]:
                fixed = apply_revisions(tasks, sim_result["revisions"])
                self.memory.add_event("simulation_applied", {"revisions": fixed})

            open_tasks = [t for t in tasks if t.status != "done"]
            if not open_tasks:
                break
            built_context = ""
            for task in open_tasks:
                before = self.roles["builder"].calls
                self._execute(task, goal, context, built_context)
                role_calls["builder"] += self.roles["builder"].calls - before
                if task.status == "done" and task.artifact:
                    built_context += f"\n### Artefakt zu '{task.title[:80]}'\n{task.artifact[:1500]}\n"

            before = self.roles["critic"].calls
            score, issues = self._critic_review(tasks, goal)
            role_calls["critic"] += self.roles["critic"].calls - before
            metacog.calibrate(predicted, score, goal)

            used_model = getattr(self.roles["builder"].llm, "model_used", None)
            if used_model:
                self.memory.add_event("model_score", {
                    "model": used_model, "score": score,
                })

            if score >= 8:
                converged = True
                break

        report = {
            "goal": goal,
            "mode": "live" if any(a.backend == "live"
                                  for a in self.roles.values()) else "offline",
            "model_used": getattr(self.roles["builder"].llm, "model_used", None),
            "cycles": cycles_used,
            "score": score,
            "issues": issues,
            "converged": converged,
            "tasks": [
                {"title": t.title, "status": t.status,
                 "artifact_preview": t.artifact[:120], "artifact": t.artifact}
                for t in tasks
            ],
            "role_calls": role_calls,
            "duration_s": round(time.time() - started, 2),
        }
        self.memory.add_event("swarm_finished", {
            "goal": goal, "score": score, "converged": converged,
            "cycles": cycles_used, "roles": role_calls,
        })
        return report

    # -- phases ---------------------------------------------------------- #
    def _orient(self, goal: str) -> str:
        return self.memory.digest(query=goal)

    def _plan(self, goal: str, context: str) -> list[SwarmTask]:
        from .metabolism import Metabolism
        met = Metabolism(self.cfg, memory=self.memory)
        met.log_state()
        prompt = (
            f"Goal: {goal}\n\nMemory:\n{context}\n\n"
            'Return ONLY JSON: {"tasks": [{"title": str, "detail": str}, ...]} '
            f'({met.plan_budget()["max_tasks"]}-5 concrete tasks, '
            f'current stress state: {met.state()}).\n"task_type": "plan"'
        )
        raw = self.roles["planner"].ask(prompt, temperature=0.2)
        try:
            data = json.loads(_first_json(raw))
            tasks = [SwarmTask(title=str(t.get("title", ""))[:120],
                               detail=str(t.get("detail", "")))
                     for t in data.get("tasks", [])][:5]
        except (json.JSONDecodeError, AttributeError):
            tasks = [SwarmTask(title=f"Draft deliverable for: {goal}",
                               detail="Fallback single-task plan")]
        return met.apply_to_plan(tasks)

    def _execute(self, task: SwarmTask, goal: str, context: str,
                 prior_artifacts: str = "") -> None:
        while task.attempts <= self.max_retries:
            task.attempts += 1
            prompt = (
                f'Goal: "{goal}"\n"task_type": "build"\n'
                f'task: "{task.title}"\ndetail: {task.detail}\n'
                f'attempt: {task.attempts}/{self.max_retries + 1}\n\n'
                f"Memory:\n{context}\n\n"
                "Artefakte bereits erledigter Aufgaben (KONSEQUENT WEITERENTWICKELN, "
                "keine neuen Produktideen erfinden):\n"
                f"{prior_artifacts or '(noch keins)'}\n\n"
                "Produce the artifact now (markdown)."
            )
            out = self.roles["builder"].ask(prompt, temperature=0.4)
            if out.strip():
                task.artifact = out
                task.status = "done"
                self.memory.remember_fact(f"swarm_artifact:{task.title[:60]}",
                                          task.artifact[:200], source="builder")
                return
        task.status = "failed"

    def _critic_review(self, tasks: list[SwarmTask], goal: str) -> tuple[int, list[str]]:
        joined = "\n".join(f"## {t.title}\n{t.artifact[:6000]}"
                           for t in tasks if t.artifact)
        prompt = (
            f'Goal: "{goal}"\n"task_type": "critique"\n'
            'Judge artifacts. Return ONLY JSON: {"score": int 0-10, "issues": [str,...]}\n\n'
            f"{joined}"
        )
        raw = self.roles["critic"].ask(prompt, temperature=0.0)
        try:
            data = json.loads(_first_json(raw))
            score = max(0, min(10, int(data.get("score", 0))))
            issues = [str(i) for i in data.get("issues", [])][:5]
        except (json.JSONDecodeError, ValueError, AttributeError):
            score, issues = 5, ["Critic output unparseable."]
        failed = [t.title for t in tasks if t.status == "failed"]
        if failed:
            score = min(score, 3)
            issues.extend(f"task failed: {t}" for t in failed)
        self.memory.remember_fact("last_swarm_critique",
                                  f"score={score}; issues={'; '.join(issues)[:300]}",
                                  source="critic")
        return score, issues


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
