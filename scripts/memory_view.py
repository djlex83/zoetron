#!/usr/bin/env python3
"""Generate data/GEDAECHTNIS.md - human-readable live memory view."""
import json
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FACTS = ROOT / "data" / "memory" / "facts.jsonl"
OUT = ROOT / "data" / "GEDAECHTNIS.md"


def main() -> None:
    if not FACTS.exists():
        return
    facts = [json.loads(l) for l in FACTS.read_text().splitlines()]
    facts.sort(key=lambda f: float(f.get("ts", 0)), reverse=True)

    def cat(key: str) -> str:
        return key.split(":")[0] if ":" in key else key

    groups = Counter(cat(f["key"]) for f in facts)
    lines = [
        "# 🧠 Zoetrons Gedächtnis (LIVE)",
        "",
        f"**{len(facts)} Fakten** · Stand {time.strftime('%Y-%m-%d %H:%M')} UTC · "
        "aktualisiert bei jedem Herzschlag",
        "",
    ]
    lines += [f"- **{c}:** {n}" for c, n in groups.most_common()]
    lines += ["", "---", ""]
    for f in facts:
        val = str(f.get("value", "")).replace("\n", " ")[:260]
        ts = time.strftime("%d.%m. %H:%M", time.gmtime(float(f.get("ts", 0))))
        lines += [f"### `{f.get('key', '?')}`",
                  f"*{ts} UTC · Quelle: {f.get('source', '?')}*", "", val, ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
