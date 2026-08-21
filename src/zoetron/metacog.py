"""METACOG - the self-model organ (metacognition).

Knows what it knows: before the critic scores a run, METACOG predicts the
score itself. The gap between prediction and reality is the calibration
error - a biological brain constantly refines this (dunning-kruger cure
as code). Over time the agent learns to say: "this plan of mine is a 4,
not a 9 - iterate before executing."
"""
from __future__ import annotations

import json
import statistics
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore


class MetaCog:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    # ------------------------------------------------------------------ #
    def predict_score(self, goal: str, task_titles: list[str]) -> int:
        """Self-assessment BEFORE execution feedback arrives."""
        prompt = (
            "You are the METACOGNITION module of an autonomous system. "
            "Based on your past performance (calibration history below), "
            "predict the quality score (0-10) an adversarial critic would "
            "give THIS plan.\n"
            'Return ONLY JSON: {"predicted_score": int}\n\n'
            '"task_type": "predict"\n'
            f"Goal: {goal}\nTasks: {task_titles}\n\n"
            f"Calibration history:\n{self._history_summary()}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.0)
        try:
            data = json.loads(_first_json(resp.text))
            return max(0, min(10, int(data.get("predicted_score", 5))))
        except (json.JSONDecodeError, ValueError, AttributeError):
            return 5

    def calibrate(self, predicted: int, actual: int, goal: str = "") -> float:
        """Record prediction vs reality; returns the absolute error."""
        error = abs(predicted - actual)
        self.memory.add_event("calibration", {
            "goal": goal[:120], "predicted": predicted,
            "actual": actual, "abs_error": error,
        })
        return error

    # ------------------------------------------------------------------ #
    def self_model(self) -> dict[str, Any]:
        """Aggregate view: how well does the system know itself?"""
        entries = [
            e["payload"] for e in self.memory.events(kind="calibration", limit=200)
        ]
        if not entries:
            return {"n": 0, "message": "no calibration data yet - run something!"}
        errors = [e["abs_error"] for e in entries]
        overconfident = sum(
            1 for e in entries if e["predicted"] > e["actual"])
        underconfident = sum(
            1 for e in entries if e["predicted"] < e["actual"])
        recent = errors[-max(3, len(errors) // 3):]
        recent_mean = statistics.mean(recent)
        overall_mean = statistics.mean(errors)
        if recent_mean < overall_mean:
            trend = "improving"
        elif recent_mean == overall_mean:
            trend = "stable"
        else:
            trend = "degrading"
        return {
            "n": len(entries),
            "mean_abs_error": round(overall_mean, 2),
            "recent_mean_abs_error": round(recent_mean, 2),
            "trend": trend,
            "overconfident_runs": overconfident,
            "underconfident_runs": underconfident,
            "last_predictions": entries[-3:],
        }

    def _history_summary(self) -> str:
        entries = [
            e["payload"] for e in self.memory.events(kind="calibration", limit=15)
        ]
        if not entries:
            return "(none yet)"
        lines = [f"pred={e['predicted']} actual={e['actual']} "
                 f"(goal: {e.get('goal', '')[:60]})" for e in entries]
        model = self.self_model()
        if isinstance(model.get("trend"), str):
            lines.append(f"trend: {model['trend']}, "
                         f"recent MAE: {model['recent_mean_abs_error']}")
        return "\n".join(lines)


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
