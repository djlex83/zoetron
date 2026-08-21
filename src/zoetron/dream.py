"""DREAM - the sleep/consolidation phase (hippocampal replay as code).

Biological sleep replays the day's experience and distills it into
long-term memory. DREAM does the same for Zoetron:

  1. REPLAY   : read recent events + artifacts from the JSONL log
  2. DISTILL  : LLM compresses them into durable insights + skill proposals
  3. INSCRIBE : insights become facts (source="dream"), events get tagged
  4. PRUNE    : (roadmap) decay low-value facts

Run it periodically (cron) or after N runs - the agent wakes up smarter
without any new external input.
"""
from __future__ import annotations

import json
import time
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


class Dream:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    # ------------------------------------------------------------------ #
    def sleep(self, lookback: int = 50) -> dict[str, Any]:
        replay = self._replay(lookback)
        if not replay:
            return {"insights": [], "skill_proposals": [], "replayed_events": 0}

        prompt = (
            "You are the DREAM module: an autonomous system is sleeping and "
            "consolidating its recent experience (hippocampal replay).\n"
            "Distill DURABLE lessons - not summaries. Find cross-cutting "
            "patterns, failure causes, and reusable procedures.\n"
            'Return ONLY JSON: {"insights": [str, ...], "skill_proposals": [str, ...]} '
            "(max 5 each, each insight one sentence, concrete).\n\n"
            '"task_type": "consolidate"\n'
            f"Recent experience:\n{replay[:4000]}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.3)
        insights: list[str] = []
        skills: list[str] = []
        try:
            data = json.loads(_first_json(resp.text))
            insights = [str(i)[:300] for i in data.get("insights", [])][:5]
            skills = [str(s)[:300] for s in data.get("skill_proposals", [])][:5]
        except (json.JSONDecodeError, AttributeError):
            insights = ["Dream could not parse its own output - check prompt size."]

        for i, insight in enumerate(insights, 1):
            self.memory.remember_fact(f"dream:{time.strftime('%Y%m%d')}:{i}",
                                      insight, source="dream")
        for s in skills:
            self.memory.add_event("skill_proposal", {"proposal": s})
        self.memory.add_event("dream_finished", {
            "insights": len(insights), "skill_proposals": len(skills),
        })
        return {"insights": insights, "skill_proposals": skills,
                "replayed_events": replay.count("\n") + 1}

    # -- replay ----------------------------------------------------------- #
    def _replay(self, lookback: int) -> str:
        lines: list[str] = []
        for e in self.memory.events(limit=lookback):
            payload = json.dumps(e.get("payload", {}), ensure_ascii=False)[:220]
            lines.append(f"[{e['kind']}] {payload}")
        for f in self.memory.facts()[-15:]:
            if f.get("source") == "dream":
                continue  # don't feed old dreams back into the new dream
            lines.append(f"[fact:{f['key'][:50]}] {str(f['value'])[:150]}")
        return "\n".join(lines)


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
