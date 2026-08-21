"""Tests for PRUNE (apoptosis / memory maintenance)."""
import json
import time

from zoetron.config import Config
from zoetron.memory import MemoryStore
from zoetron.prune import Prune


def _prune(tmp_path) -> Prune:
    return Prune(Config(data_dir=tmp_path),
                 memory=MemoryStore(tmp_path / "memory"))


def _age_events(mem: MemoryStore, kind: str, days: float) -> None:
    path = mem.events_path
    lines = [json.loads(l) for l in path.read_text().splitlines() if l]
    for e in lines:
        if e["kind"] == kind:
            e["ts"] -= days * 86400
    path.write_text("\n".join(json.dumps(e) for e in lines) + "\n")


def test_young_facts_survive(tmp_path):
    mem = MemoryStore(tmp_path / "memory")
    mem.remember_fact("fresh", "recent insight")
    stats = _prune(tmp_path).run()
    assert stats["facts_pruned"] == 0
    assert any(f["key"] == "fresh" for f in mem.facts())


def test_old_unrecalled_fact_is_archived_not_lost(tmp_path):
    tmp = tmp_path
    mem = MemoryStore(tmp / "memory")
    mem.remember_fact("stale", "old memory")
    # age the fact beyond TTL
    p = mem.facts_path
    rows = [json.loads(l) for l in p.read_text().splitlines() if l]
    for r in rows:
        r["ts"] -= 20 * 86400          # 20 days old, TTL is 14
    p.write_text("\n".join(json.dumps(r) for r in rows) + "\n")

    stats = _prune(tmp).run()
    assert stats["facts_pruned"] == 1
    assert mem.facts() == []           # gone from active store...
    arch = (tmp / "memory" / "archive").exists() or \
           (Config(data_dir=tmp).data_dir / "archive").exists()
    assert arch                        # ...but archived


def test_recalled_facts_are_kept(tmp_path):
    tmp = tmp_path
    mem = MemoryStore(tmp / "memory")
    mem.remember_fact("precious", "important learning")
    p = mem.facts_path
    rows = [json.loads(l) for l in p.read_text().splitlines() if l]
    for r in rows:
        r["ts"] -= 20 * 86400
    p.write_text("\n".join(json.dumps(r) for r in rows) + "\n")
    mem.recall("precious")             # marks it as used

    stats = _prune(tmp).run()
    assert stats["facts_pruned"] == 0
    assert len(mem.facts()) == 1


def test_old_events_archived_insights_survive(tmp_path):
    tmp = tmp_path
    mem = MemoryStore(tmp / "memory")
    mem.add_event("insight", {"text": "keep me forever"})
    mem.add_event("swarm_started", {"goal": "transient"})
    _age_events(mem, "swarm_started", days=10)

    stats = _prune(tmp).run()
    assert stats["events_pruned"] >= 1
    kinds = [e["kind"] for e in mem.events()]
    assert "insight" in kinds          # insights are immortal
    assert "swarm_started" not in kinds
