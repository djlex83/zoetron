#!/usr/bin/env python3
"""WEEKLY REPORT - the organism's public voice.

Aggregates one week of memory events into a shareable markdown report
(German + English) that proves the project is alive: what was learned,
how many runs, evolution winners, current model chain.

Usage: python scripts/weekly_report.py [--out docs/REPORTS]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEM = ROOT / "data" / "memory"


def _load(name: str) -> list[dict]:
    path = MEM / name
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def build_report() -> str:
    now = time.time()
    week_ago = now - 7 * 86400
    events = [e for e in _load("events.jsonl")
              if float(e.get("ts", 0)) >= week_ago]
    facts = _load("facts.jsonl")

    kinds = Counter(e.get("kind", "?") for e in events)
    swarm_runs = [e for e in events if e.get("kind") == "swarm_finished"]
    scores = [e["payload"].get("score") for e in swarm_runs
              if isinstance(e.get("payload"), dict)
              and isinstance(e["payload"].get("score"), (int, float))]
    evolutions = [e for e in events if e.get("kind") == "evolution_run"]
    insights = [f for f in facts
                if f.get("key", "").startswith(("insight:", "dream:"))]
    senses = kinds.get("sense_cycle", 0)
    hand_ok = sum(1 for e in events if e.get("kind") == "hand_action"
                  and isinstance(e.get("payload"), dict)
                  and e["payload"].get("ok"))

    # top model of the week: critic scores beat metadata (AUTOROUTER wisdom)
    per_model: dict[str, list[float]] = {}
    for e in events:
        if e.get("kind") != "model_score":
            continue
        payload = e.get("payload") or {}
        model, sc = payload.get("model"), payload.get("score")
        if isinstance(model, str) and isinstance(sc, (int, float)):
            per_model.setdefault(model, []).append(float(sc))
    top_model = None
    if per_model:
        name, scs = max(per_model.items(),
                        key=lambda kv: sum(kv[1]) / len(kv[1]))
        top_model = (name, round(sum(scs) / len(scs), 1), len(scs))

    # commits pushed this week (public proof of life)
    try:
        commits = len(subprocess.run(
            ["git", "-C", str(ROOT), "log", "--since=7 days ago",
             "--pretty=%h"], capture_output=True, text=True,
            timeout=15).stdout.split())
    except Exception:  # noqa: BLE001
        commits = 0

    # "Zoetron sagt": one of its own insights, stable per ISO week
    cal = datetime.now(timezone.utc).isocalendar()
    zoetron_says = (insights[cal.week % len(insights)]
                    if insights else None)

    iso = datetime.now(timezone.utc).strftime("%G-W%V")
    avg = round(sum(scores) / len(scores), 1) if scores else None
    de, en = [], []

    de.append(f"# Zoetron Wochenreport {iso}")
    de.append("")
    de.append("**Der Organismus lebt. Das ist passiert (letzte 7 Tage):**")
    de.append("")
    de.append(f"- 🫀 **{kinds.get('swarm_finished', 0)} Swarm-Läufe**, "
              f"ø Score {avg if avg is not None else '–'}/10")
    de.append(f"- 💭 **{len(insights)} dauerhafte Einsichten** im Gedächtnis")
    de.append(f"- 🧬 **{len(evolutions)} Evolutionsrunden** "
              f"(Misserfolg → neue Strategien)")
    de.append(f"- 👁 **{senses} Sinneszyklen** (HN-Frontier beobachtet)")
    de.append(f"- ✋ **{hand_ok} erfolgreiche Code-Ausführungen**")
    de.append(f"- 📦 **{commits} Commits** auf GitHub")
    if top_model:
        name, avg_sc, n = top_model
        de.append(f"- 🧠 **Top-Modell der Woche:** `{name}` "
                  f"(ø Score {avg_sc} aus {n} Läufen)")
    de.append("")
    if zoetron_says:
        quote = str(zoetron_says.get("value", ""))[:220]
        de.append('## Zoetron sagt')
        de.append("")
        de.append(f"> {quote}")
        de.append("")
    if insights:
        de.append("## Was gelernt wurde (Auswahl)")
        de.append("")
        for f in insights[-3:]:
            de.append(f"- {str(f.get('value', ''))[:140]}")
        de.append("")
    de.append("---")
    de.append("*Automatisch generiert von Zoetrons Herzschlag. "
              "Live: github.com/djlex83/zoetron*")

    en.append("")
    en.append("## English summary")
    en.append("")
    en.append(f"The organism ran **{kinds.get('swarm_finished', 0)} swarm "
              f"cycles** (avg score {avg if avg is not None else '–'}/10), "
              f"distilled **{len(insights)} lasting insights**, evolved "
              f"**{len(evolutions)}x** after failures, watched the HN "
              f"frontier **{senses}x** and executed code successfully "
              f"**{hand_ok}x**. Fully autonomous, zero human input.")
    de.extend(en)
    return "\n".join(de)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(ROOT / "docs" / "REPORTS"))
    args = parser.parse_args()
    report = build_report()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    iso = datetime.now(timezone.utc).strftime("%G-W%V")
    path = out_dir / f"{iso}.md"
    path.write_text(report + "\n", encoding="utf-8")
    print(f"report geschrieben: {path.relative_to(ROOT)}")
    print(report[:600])


if __name__ == "__main__":
    main()
