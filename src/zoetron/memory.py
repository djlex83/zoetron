"""Persistent memory: append-only event log + queryable fact store (JSONL)."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any


class MemoryStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.events_path = self.root / "events.jsonl"
        self.facts_path = self.root / "facts.jsonl"
        self.root.mkdir(parents=True, exist_ok=True)

    # -- append ------------------------------------------------------------- #
    def add_event(self, kind: str, payload: dict[str, Any]) -> dict[str, Any]:
        event = {"ts": time.time(), "kind": kind, "payload": payload}
        with self.events_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")
        return event

    def remember_fact(self, key: str, value: str, source: str = "system") -> dict[str, Any]:
        fact = {"ts": time.time(), "key": key, "value": value, "source": source}
        with self.facts_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(fact, ensure_ascii=False) + "\n")
        return fact

    # -- recall ------------------------------------------------------------- #
    def facts(self) -> list[dict[str, Any]]:
        return self._read_jsonl(self.facts_path)

    def write_facts(self, rows: list[dict[str, Any]]) -> None:
        """Rewrite the fact store (used by PRUNE after archiving)."""
        tmp = self.facts_path.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as fh:
            for r in rows:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
        tmp.replace(self.facts_path)

    def write_events(self, rows: list[dict[str, Any]]) -> None:
        """Rewrite the event store (used by PRUNE after archiving)."""
        tmp = self.events_path.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as fh:
            for r in rows:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
        tmp.replace(self.events_path)

    def events(self, kind: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
        items = self._read_jsonl(self.events_path)
        if kind:
            items = [e for e in items if e.get("kind") == kind]
        return items[-limit:]

    def recall(self, query: str, top_k: int = 5) -> list[tuple[float, dict[str, Any]]]:
        """Naive keyword-scored recall over facts + event payloads."""
        terms = _tokenize(query)
        scored: list[tuple[float, dict[str, Any]]] = []
        docs: list[dict[str, Any]] = []
        for f in self.facts():
            docs.append({"type": "fact", "key": f["key"], "value": f["value"], "ts": f["ts"]})
        for e in self.events():
            docs.append({"type": "event", "kind": e["kind"],
                         "value": json.dumps(e["payload"], ensure_ascii=False)[:400],
                         "ts": e["ts"]})
        for doc in docs:
            hay = _tokenize(doc["key"] + " " + doc["value"]) if doc["type"] == "fact" \
                else _tokenize(doc["value"])
            overlap = len(terms & hay)
            if overlap:
                recency = max(0.0, 1.0 - (time.time() - doc["ts"]) / (30 * 24 * 3600))
                scored.append((overlap + 0.25 * recency, doc))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        result = scored[:top_k]
        # usage tracking: PRUNE keeps recalled facts alive
        used_keys = [d["key"] for _, d in result if d.get("type") == "fact" and d.get("key")]
        if used_keys:
            self.add_event("recall", {"keys": used_keys})
        return result

    def digest(self, query: str = "", limit: int = 3) -> str:
        """Compact context block injected into prompts (metabolic memory)."""
        lines: list[str] = []
        facts = self.facts()[-limit:]
        for f in facts:
            lines.append(f"- FACT [{f['key']}]: {f['value']}")
        if query:
            for _, doc in self.recall(query, top_k=limit):
                lines.append(f"- RECALL ({doc['type']}): {doc['value'][:160]}")
        return "\n".join(lines) if lines else "- (no memories yet)"

    # -- helpers ------------------------------------------------------------ #
    @staticmethod
    def _read_jsonl(path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            return []
        out: list[dict[str, Any]] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return out


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-zA-Z_][\w-]{2,}", text.lower()) if t}
