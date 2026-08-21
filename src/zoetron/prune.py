"""PRUNE - apoptosis / synapse maintenance for the memory.

Biology prunes unused connections to stay sharp. Zoetron does the same:
facts that are old AND never recalled get absorbed into a monthly digest
and removed from the active fact store. Events older than a retention
window are archived the same way.

Nothing is lost: pruned content lands in archive/YYYY-MM.jsonl first.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

from .config import Config
from .memory import MemoryStore

FACT_TTL_DAYS = 14          # facts younger than this always survive
EVENT_TTL_DAYS = 7
ARCHIVE_DIR = "archive"


class Prune:
    def __init__(self, cfg: Config, memory: MemoryStore | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")

    # -- helpers ------------------------------------------------------------ #
    def _recalled_keys(self) -> set[str]:
        """Keys that appear in recall events count as 'used'."""
        keys: set[str] = set()
        for e in self.memory.events(kind="recall", limit=200):
            payload = e.get("payload", {})
            k = payload.get("key")
            if k:
                keys.add(str(k))
            for k2 in payload.get("keys") or []:
                if k2:
                    keys.add(str(k2))
        return keys

    def _archive(self, month: str, rows: list[dict]) -> int:
        if not rows:
            return 0
        arch = self.cfg.data_dir / ARCHIVE_DIR
        arch.mkdir(parents=True, exist_ok=True)
        path = arch / f"{month}.jsonl"
        with path.open("a", encoding="utf-8") as fh:
            for r in rows:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
        return len(rows)

    # -- main prune ----------------------------------------------------------#
    def run(self) -> dict[str, int]:
        now = time.time()
        fact_ttl = FACT_TTL_DAYS * 86400
        event_ttl = EVENT_TTL_DAYS * 86400
        recalled = self._recalled_keys()

        stats = {"facts_pruned": 0, "events_pruned": 0}

        # --- facts ------------------------------------------------------- #
        facts = self.memory.facts()
        keep_facts, prune_facts = [], []
        for f in facts:
            age = now - float(f.get("ts", now))
            if age < fact_ttl or str(f.get("key")) in recalled:
                keep_facts.append(f)
            else:
                prune_facts.append(f)
        if prune_facts:
            month = time.strftime("%Y-%m", time.gmtime())
            self._archive(month, prune_facts)
            self.memory.write_facts(keep_facts)
            stats["facts_pruned"] = len(prune_facts)

        # --- events ------------------------------------------------------ #
        events = self.memory.events(limit=100000)
        keep_events, prune_events = [], []
        for e in events:
            age = now - float(e.get("ts", now))
            if age < event_ttl or e.get("kind") in ("insight",):
                keep_events.append(e)
            else:
                prune_events.append(e)
        if prune_events:
            month = time.strftime("%Y-%m", time.gmtime())
            self._archive(month, prune_events)
            self.memory.write_events(keep_events)
            stats["events_pruned"] = len(prune_events)

        self.memory.add_event("prune_run", stats)
        return stats


def _noop() -> None:  # pragma: no cover
    pass
