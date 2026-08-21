"""HANDS - the motor organ: actually running code, not just writing prose.

Biology: thinking without acting changes nothing in the world. HANDS gives
Zoetron real actuators:

  - execute(): run Python in the organism's own sandbox (workspace dir),
    with timeout, output caps and a hard forbidden-pattern filter.
  - do_task(): LLM writes a small program for a task, HANDS runs it and
    records what happened - closing the loop thought -> action -> result.

Every action lands in memory as events (hand_action / hand_task) so DREAM
can learn which kinds of actions succeed.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from .config import Config
from .llm import LLM, Message, make_llm
from .memory import MemoryStore

FORBIDDEN = ("rm -rf /", ":(){", "mkfs", "dd if=", "> /dev/sd",
             "shutdown", "curl .. | sh")
STDOUT_CAP = 2000


class Hands:
    def __init__(self, cfg: Config, llm: LLM | None = None,
                 memory: MemoryStore | None = None,
                 sandbox: Path | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        self.sandbox = sandbox or (Path(cfg.data_dir) / "hands_workspace")
        self.sandbox.mkdir(parents=True, exist_ok=True)
        if llm is None:
            llm, _ = make_llm(cfg)
        self.llm = llm

    # -- raw actuator --------------------------------------------------------#
    def execute(self, code: str, *, timeout: float = 30.0) -> dict[str, Any]:
        """Run a Python snippet in the sandbox. Never raises."""
        for pat in FORBIDDEN:
            if pat in code:
                result: dict[str, Any] = {
                    "ok": False, "error": f"forbidden pattern: {pat}"}
                self.memory.add_event("hand_action", {**result, "preview":
                                                      code[:80]})
                return result
        fname = self.sandbox / f"action_{int(time.time() * 1000)}.py"
        fname.write_text(code, encoding="utf-8")
        started = time.time()
        try:
            proc = subprocess.run(
                [sys.executable, str(fname)], capture_output=True, text=True,
                timeout=timeout, cwd=str(self.sandbox))
            result = {"ok": proc.returncode == 0,
                      "exit": proc.returncode,
                      "stdout": proc.stdout[-STDOUT_CAP:],
                      "stderr": proc.stderr[-800:],
                      "duration_s": round(time.time() - started, 2)}
        except subprocess.TimeoutExpired:
            result = {"ok": False, "error": f"timeout after {timeout}s",
                      "duration_s": round(time.time() - started, 2)}
        result["script"] = fname.name
        self.memory.add_event("hand_action", {
            "ok": result.get("ok"), "exit": result.get("exit"),
            "error": result.get("error"), "duration_s": result.get("duration_s"),
        })
        return result

    # -- cognitive layer -----------------------------------------------------#
    def do_task(self, description: str) -> dict[str, Any]:
        """LLM plans a small program -> HANDS runs it -> result recorded."""
        prompt = (
            "You are the HANDS module: convert the task into ONE small, "
            "self-contained Python program that performs it using only the "
            "standard library. Print the essential result to stdout.\n"
            'Return ONLY JSON: {"code": str, "explanation": str}\n'
            '"task_type": "act"\n\n'
            f"Task: {description}"
        )
        resp = self.llm.complete([Message("user", prompt)], temperature=0.2)
        try:
            data = json.loads(_first_json(resp.text))
            code = str(data.get("code", ""))
            explanation = str(data.get("explanation", ""))[:300]
        except (json.JSONDecodeError, AttributeError):
            return {"ok": False, "error": "planner produced no valid program"}

        run = self.execute(code)
        outcome = {"planned": explanation, **run}
        self.memory.add_event("hand_task", {
            "task": description[:160], "ok": run.get("ok"),
            "exit": run.get("exit"), "error": run.get("error"),
        })
        return outcome


def _first_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        raise json.JSONDecodeError("no json object", text, 0)
    return text[start:end + 1]
