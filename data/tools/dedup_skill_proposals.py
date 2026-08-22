"""Zoetron-Werkzeug: Dedupliziert Skill-Vorschlaege im Gedächtnis.

Liest facts.jsonl, findet swarm_artifact-Eintraege mit sehr
aehnlichen Schluesseln (Stichwort-Schnitt > 60%) und archiviert
Dubletten nach data/memory/dedup_archiv.json.
Laufbar ohne Argumente. Teil der Werkzeugkiste (Reflex-Pfad).
"""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / "data" / "memory"
facts_path = BASE / "facts.jsonl"


def _words(s: str) -> set[str]:
    return {w.lower() for w in s.split() if len(w) > 4}


def main() -> None:
    rows = [json.loads(l) for l in facts_path.read_text().splitlines()
            if l.strip()]
    arts = [r for r in rows if r.get("key", "").startswith("swarm_artifact:")]
    keep: list[dict] = []
    dupes: list[dict] = []
    for a in arts:
        wa = _words(a.get("key", ""))
        twin = any(
            len(wa & wb) / max(len(wa | wb), 1) > 0.6
            for wb in [_words(k["key"]) for k in keep])
        (dupes if twin else keep).append(a)
    out = BASE / "dedup_archiv.json"
    out.write_text(json.dumps(dupes, ensure_ascii=False, indent=1))
    print(json.dumps({
        "artefakte": len(arts),
        "behalten": len(keep),
        "duplikate_archiviert": len(dupes),
        "archiv": str(out.name)}))


if __name__ == "__main__":
    main()
