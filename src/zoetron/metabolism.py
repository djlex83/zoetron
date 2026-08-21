"""METABOLISM - the stress axis / endocrine organ.

Biology: under resource scarcity the body conserves - smaller meals,
lower activity, energy only for essentials. Zoetron's equivalent:
rate limits, timeouts and model failures raise a "stress" level
(0.0 = relaxed .. 1.0 = starving). The swarm reads it BEFORE planning
and shrinks its appetite accordingly:

    stress < 0.3 : full appetite  (5 tasks, 2 iterations)
    stress 0.3-0.6: moderate      (4 tasks, 2 iterations)
    stress > 0.6 : conserve       (3 tasks, 1 iteration)

Stress decays over time (cortisol clearance), so recovery is automatic.
"""
from __future__ import annotations

import time
from typing import Any

from .config import Config
from .memory import MemoryStore

# events that indicate environmental scarcity
STRESS_WEIGHTS = {
    "model_fail": 0.15,
    "timeout": 0.20,
}

DECAY_PER_HOUR = 0.25          # cortisol clearance
MAX_TASKS_FULL, MAX_ITERS_FULL = 5, 2
MIN_TASKS_CONSERVE = 3


class Metabolism:
    def __init__(self, cfg: Config, memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")

    # -- sensing ----------------------------------------------------------- #
    def stress_level(self) -> float:
        """Environmental stress from recent failures, with time decay."""
        now = time.time()
        level = 0.0
        for e in self.memory.events(limit=200):
            age_h = max(0.0, (now - e.get("ts", now)) / 3600.0)
            w = STRESS_WEIGHTS.get(e["kind"], 0.0)
            if w:
                level += w * (DECAY_PER_HOUR ** age_h)
        return round(min(1.0, level), 3)

    def state(self) -> str:
        s = self.stress_level()
        if s >= 0.6:
            return "conserve"
        if s >= 0.3:
            return "moderate"
        return "full"

    # -- appetite ---------------------------------------------------------- #
    def plan_budget(self) -> dict[str, int]:
        """How many tasks/iterations this organism should attempt now."""
        st = self.state()
        if st == "full":
            return {"max_tasks": MAX_TASKS_FULL,
                    "max_iterations": MAX_ITERS_FULL}
        if st == "moderate":
            return {"max_tasks": 4, "max_iterations": 2}
        return {"max_tasks": MIN_TASKS_CONSERVE, "max_iterations": 1}

    # -- actuator ---------------------------------------------------------- #
    def apply_to_plan(self, tasks: list[Any]) -> list[Any]:
        cap = self.plan_budget()["max_tasks"]
        return tasks[:cap]

    def log_state(self) -> None:
        self.memory.add_event("metabolism_check", {
            "stress": self.stress_level(),
            "state": self.state(),
            "budget": self.plan_budget(),
        })
