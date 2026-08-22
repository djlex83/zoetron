"""EVOLUTION - reproduction with variation and selection.

The final organ on the ladder: Zoetron spawns N variants of a solution
approach (different temperatures / angles via the AutoRouter's model
diversity), lets the CRITIC judge them all, and keeps the fittest.
Survivor + lineage are recorded so DREAM can learn which variations win.

This is Darwin in code:
    VARIATION  : N candidate solutions from the LLM pool
    SELECTION  : critic scores each, best wins
    HEREDITY   : winner + scores stored as evolution events
"""
from __future__ import annotations

import json
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


class Evolution:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    # -- variation ------------------------------------------------------------#
    def vary(self, problem: str, n: int = 3) -> list[dict[str, str]]:
        """Produce N distinct solution candidates for one problem."""
        prompt = (
            "You are the EVOLUTION module: produce "
            f"{n} FUNDAMENTALLY DIFFERENT solution approaches.\n"
            "Each must attack the problem from another angle.\n"
            'Return ONLY JSON: {"variants": [{"angle": str, "solution": str}]}'
            '\n\n"task_type": "evolve"\n\n'
            f"Problem: {problem}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.9)
        try:
            data = json.loads(_first_json(resp.text))
            return [v for v in data.get("variants", [])[:n]
                    if isinstance(v, dict) and v.get("solution")]
        except (json.JSONDecodeError, AttributeError):
            return []

    # -- selection --------------------------------------------------------------#
    def select(self, problem: str,
               variants: list[dict[str, str]]) -> dict[str, Any] | None:
        """Critic judges all variants; returns the fittest with its score."""
        if not variants:
            return None
        listing = "\n".join(
            f"[{i}] angle: {v.get('angle', '?')}\n"
            f"solution: {str(v.get('solution', ''))[:600]}"
            for i, v in enumerate(variants))
        prompt = (
            "You are the SELECTION module of an evolutionary system.\n"
            f"Problem: {problem}\nScore each variant 0-10 for elegance, "
            "feasibility and impact; pick ONE winner.\n"
            'Return ONLY JSON: {"scores": [num, ...], '
            '"winner": index, "reason": str}\n'
            '"task_type": "select"\n\n'
            f"Variants:\n{listing}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.2)
        try:
            data = json.loads(_first_json(resp.text))
            idx = int(data.get("winner", 0))
            if not 0 <= idx < len(variants):
                idx = 0
            return {"winner": variants[idx], "index": idx,
                    "scores": data.get("scores", []),
                    "reason": str(data.get("reason", ""))[:300]}
        except (json.JSONDecodeError, ValueError, AttributeError):
            return {"winner": variants[0], "index": 0, "scores": [],
                    "reason": "selection failed - first variant survives"}

    # -- full cycle ---------------------------------------------------------------#
    def evolve(self, problem: str, n: int = 3) -> dict[str, Any]:
        """Variation -> selection -> heredity. Never raises."""
        result: dict[str, Any] = {"problem": problem[:120], "variants": 0}
        try:
            variants = self.vary(problem, n=n)
            result["variants"] = len(variants)
            outcome = self.select(problem, variants)
            if outcome:
                # ANTI-PATTERNS: Verworfene Varianten merken - sie
                # duerfen nicht erneut vorgeschlagen werden.
                for j, v in enumerate(variants):
                    if j == outcome["index"]:
                        continue
                    self.memory.add_fact(
                        f"anti_pattern:{problem[:60]}:{j}",
                        f"ABGELEHNT von Evolution (Score "
                        f"{(outcome['scores'] or ['?'])[j:j+1][0] if outcome['scores'] else '?'}): "
                        f"{str(v.get('angle', ''))[:80]} - "
                        f"{str(v.get('solution', ''))[:200]} "
                        f"NICHT wiederholt anbieten.",
                        source="evolution")
                result.update({
                    "winner_angle": str(outcome["winner"].get("angle", ""))[:100],
                    "score": (outcome["scores"] or [None])[outcome["index"]]
                    if outcome["scores"] else None,
                    "reason": outcome["reason"],
                })
                self.memory.add_event("evolution_run", {
                    "problem": result["problem"],
                    "variants": len(variants),
                    "winner_index": outcome["index"],
                    "scores": outcome["scores"],
                })
        except Exception as exc:  # noqa: BLE001 - evolution must not crash host
            result["error"] = str(exc)[:160]
        return result


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
