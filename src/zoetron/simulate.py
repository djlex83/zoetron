"""SIMULATE - the world-model organ.

Biological brains rehearse actions in an inner simulation before moving a
muscle. SIMULATE does the same for Zoetron: right after planning, it
dry-runs the plan against memory experience and returns risks plus a
verdict ("go" or "revise"). Revisions are folded back into the task
details BEFORE any builder spends tokens - cheaper errors.
"""
from __future__ import annotations

import json
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


class Simulate:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    def dry_run(self, goal: str, tasks: list[dict[str, str]]) -> dict[str, Any]:
        prompt = (
            "You are the WORLD-MODEL module: simulate this plan mentally "
            "before execution. Use past failures in memory as evidence.\n"
            'Return ONLY JSON: {"verdict": "go"|"revise", '
            '"risks": [{"task": str, "risk": str}], '
            '"revisions": [{"task": str, "change": str}]}\n'
            "(max 5 risks/revisions; empty lists if solid)\n\n"
            '"task_type": "simulate"\n'
            f"Goal: {goal}\n"
            f"Plan: {json.dumps(tasks, ensure_ascii=False)[:1500]}\n"
            f"Past failures:\n{self._failure_digest()}"
        )
        try:
            resp = self.llm.complete([Message("user", prompt)], temperature=0.2)
            data = json.loads(_first_json(resp.text))
            verdict = str(data.get("verdict", "go"))
            if verdict not in ("go", "revise"):
                verdict = "go"
            risks = [str(r.get("risk", ""))[:200]
                     for r in data.get("risks", [])[:5] if isinstance(r, dict)]
            revisions = [{"task": str(r.get("task", ""))[:120],
                          "change": str(r.get("change", ""))[:300]}
                         for r in data.get("revisions", [])[:5]
                         if isinstance(r, dict)]
        except (json.JSONDecodeError, AttributeError):
            verdict, risks, revisions = "go", [], []
        self.memory.add_event("simulation", {
            "goal": goal[:120], "verdict": verdict,
            "risks": len(risks), "revisions": len(revisions),
        })
        return {"verdict": verdict, "risks": risks, "revisions": revisions}

    def _failure_digest(self) -> str:
        lines = [f"- {str(e['payload'].get('goal', ''))[:90]} "
                 f"(score {e['payload'].get('score')})"
                 for e in self.memory.events(kind="run_finished", limit=30)
                 if e["payload"].get("converged") is False]
        crits = [f"- {f['value'][:140]}" for f in self.memory.facts()
                 if f["key"] == "last_critique"][-3:]
        return "\n".join(lines + crits) or "(none recorded)"


def apply_revisions(tasks: list[Any], revisions: list[dict[str, str]]) -> int:
    """Fold simulation revisions into task details (fuzzy title match)."""
    applied = 0
    for rev in revisions:
        target = (rev.get("task") or "").lower().strip()
        change = rev.get("change") or ""
        if not target or not change:
            continue
        for t in tasks:
            title = t.title.lower()
            if target in title or title in target:
                t.detail = f"{t.detail} | SIMULATION-FIX: {change}".strip(" |")
                applied += 1
                break
    return applied


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
