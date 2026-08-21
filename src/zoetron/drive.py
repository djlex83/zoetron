"""DRIVE - the curiosity engine (autonomous goal generation).

A step toward ASI: the system stops being an oracle-on-demand and starts
generating its OWN goals from gaps in its memory, like intrinsic motivation
in biological brains.

Signals used (all from the local JSONL memory, no external deps):
  - coverage gaps : themes with few/no events yet
  - failure zones : tasks that failed -> worth another, better attempt
  - stale knowledge: facts/events not revisited for a long time
  - distant pairs : two unrelated memories -> novel-combination goals
"""
from __future__ import annotations

import json
import random
import time
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


class Drive:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    # ------------------------------------------------------------------ #
    def generate_goals(self, n: int = 3) -> list[dict[str, Any]]:
        signals = self._collect_signals()
        # SENSES: fresh external signals become first-class DRIVE input
        try:
            from .senses import Senses
            frontier = Senses(self.cfg,
                              memory=self.memory).curiosity_goals(max_n=1)
            if frontier:
                signals["external"] = frontier
        except Exception:  # noqa: BLE001 - eyes may fail, DRIVE continues
            pass
        prompt = (
            "You are the DRIVE module of an autonomous cognitive system "
            "(intrinsic motivation).\n"
            "Below are signals from its memory. Generate exactly "
            f"{n} self-chosen goals that maximize future capability.\n"
            'Return ONLY JSON: {"goals": [{"title": str, "why": str, '
            '"signal": "gap|failure|stale|combination"}]}\n\n'
            '"task_type": "goals"\n'
            f"Signals:\n{json.dumps(signals, ensure_ascii=False)[:3000]}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.7)
        try:
            data = json.loads(_first_json(resp.text))
            goals = list(data.get("goals", []))[:n]
        except (json.JSONDecodeError, AttributeError):
            goals = []
        if not goals:  # deterministic fallback from raw signals
            goals = self._fallback_goals(signals, n)
        for g in goals:
            g.setdefault("signal", "gap")
            self.memory.add_event("drive_goal", {
                "title": str(g.get("title", ""))[:160],
                "why": str(g.get("why", ""))[:300],
                "signal": g.get("signal", "gap"),
            })
        return goals

    def pick_goal(self) -> dict[str, Any] | None:
        """Curiosity-weighted choice: novelty + failure-retry + staleness."""
        goals = self.generate_goals()
        if not goals:
            return None
        weights = {"gap": 1.0, "combination": 0.9, "failure": 0.8, "stale": 0.6}
        scored = [(
            weights.get(g.get("signal", "gap"), 0.5) * (0.75 + 0.5 * random.random()),
            g,
        ) for g in goals]
        scored.sort(key=lambda p: p[0], reverse=True)
        chosen = scored[0][1]
        self.memory.add_event("drive_chosen", {
            "title": chosen.get("title", "")[:160],
            "why": chosen.get("why", "")[:300],
        })
        return chosen

    # -- signals --------------------------------------------------------- #
    def _collect_signals(self) -> dict[str, Any]:
        events = self.memory.events(limit=300)
        kinds: dict[str, int] = {}
        failures: list[str] = []
        for e in events:
            kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
            if e["kind"] == "run_finished":
                p = e.get("payload", {})
                if p.get("converged") is False:
                    failures.append(str(p.get("goal", ""))[:100])
        facts = self.memory.facts()
        stale = [
            f["key"] for f in facts
            if time.time() - f.get("ts", 0) > 7 * 24 * 3600
        ][:5]
        # distant pairs: two facts with zero token overlap
        pairs: list[list[str]] = []
        keys = [f["key"] for f in facts[-12:]]
        if len(keys) >= 2:
            a, b = random.sample(keys, 2)
            pairs = [[a[:60], b[:60]]]
        return {
            "event_kinds": kinds,
            "unconverged_goals": failures[:5],
            "stale_facts": stale,
            "distant_memory_pair": pairs,
            "total_facts": len(facts),
        }

    def _fallback_goals(self, signals: dict[str, Any], n: int) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for goal in signals.get("unconverged_goals", [])[:n]:
            out.append({"title": f"Retry with new strategy: {goal}",
                        "why": "previous run did not converge",
                        "signal": "failure"})
        while len(out) < n:
            i = len(out)
            out.append({"title": f"Explore blind spot #{i + 1} in memory coverage",
                        "why": "few events recorded in this area",
                        "signal": "gap"})
        return out[:n]


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
