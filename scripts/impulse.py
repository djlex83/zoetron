#!/usr/bin/env python3
"""IMPULS - spontaneous cortical activity between heartbeats.

The HERZ cron is the fixed pulse (sinus rhythm). This script is the
random firing on top: with some probability, and only when something
NEW happened in memory ("etwas ist eingefallen"), it picks a random
light organ action and speaks about it.

Design:
  - fires at most once per random cooldown (80-200 min)
  - only fires if new memory events appeared since the last tick
  - picks randomly: neugier (senses+goal), traum (dream), gruebel (drive)
  - reports to Telegram + prints a short summary (cron delivery)
  - stays completely silent otherwise (watchdog pattern)

Env override for testing: IMPULSE_FORCE=1 fires regardless.
"""
from __future__ import annotations

import json
import os
import random
import subprocess
import time
from pathlib import Path

ROOT = Path("/workspace/zoetron")
PY = ROOT / ".venv" / "bin" / "python"
STATE = ROOT / "data" / "impulse_state.json"
EVENTS = ROOT / "data" / "memory" / "events.jsonl"
TG = ROOT / "scripts" / "tg_post.sh"

MIN_GAP = 80 * 60
MAX_GAP = 200 * 60
FIRE_P = 0.35


def load_state() -> dict:
    try:
        return json.loads(STATE.read_text())
    except Exception:  # noqa: BLE001
        return {}


def save_state(st: dict) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st))


def count_events() -> int:
    try:
        with EVENTS.open() as fh:
            return sum(1 for _ in fh)
    except OSError:
        return 0


def run_cli(args: list[str]) -> str:
    try:
        r = subprocess.run([str(PY), "-m", "zoetron.cli", *args],
                           capture_output=True, text=True, timeout=240,
                           cwd=str(ROOT))
        return (r.stdout or "").strip()
    except Exception:  # noqa: BLE001
        return ""


def run_py(snippet: str) -> str:
    try:
        r = subprocess.run([str(PY), "-c", snippet],
                           capture_output=True, text=True, timeout=240,
                           cwd=str(ROOT))
        return (r.stdout or "").strip()
    except Exception:  # noqa: BLE001
        return ""


def send_telegram(text: str) -> None:
    try:
        subprocess.run(["bash", str(TG)], input=text, text=True,
                       timeout=45, capture_output=True)
    except Exception:  # noqa: BLE001
        pass


def act(kind: str) -> str:
    if kind == "neugier":
        out = run_py(
            "import sys; sys.path.insert(0,'src');\n"
            "from zoetron.config import Config\n"
            "from zoetron.senses import Senses\n"
            "s = Senses(Config())\n"
            "r = s.look(top_n=2)\n"
            "titles = [i['title'][:80] for i in r['frontier']]\n"
            "goals = [g['title'][:90] for g in s.curiosity_goals(max_n=1)]\n"
            "print('NEUGIER\\n' + '\\n'.join(titles) + '\\n-> ' + "
            "(goals[0] if goals else 'kein neues Ziel'))")
        return out or "NEUGIER\n(Augen blieben trocken - kein Signal)"
    if kind == "traum":
        out = run_cli(["dream", "--lookback", "90"])
        lines = [ln for ln in out.splitlines() if ln.strip()][-2:]
        return "TRAUM\n" + ("\n".join(lines) if lines else "(nichts Neues zu verdauen)")
    return "GRUEBELN\n" + (run_cli(["drive"])[:400] or "(keine Ziele gefunden)")


def main() -> None:
    if not PY.exists():
        return
    st = load_state()
    now = time.time()
    n = count_events()
    new_events = n - st.get("last_count", n)
    st["last_count"] = n

    force = os.environ.get("IMPULSE_FORCE") == "1"
    if not force:
        if now < st.get("earliest_next", 0) or new_events <= 0:
            save_state(st)
            return
        if random.random() >= FIRE_P:
            save_state(st)
            return

    st["earliest_next"] = now + random.randint(MIN_GAP, MAX_GAP)
    save_state(st)

    kind = random.choice(["neugier", "traum", "gruebel"])
    body = act(kind)
    stamp = time.strftime("%H:%M", time.gmtime())
    msg = f"⚡ Zoetron-Impuls ({stamp} UTC, spontan):\n{body}"
    send_telegram(msg)
    print(msg)


if __name__ == "__main__":
    main()
