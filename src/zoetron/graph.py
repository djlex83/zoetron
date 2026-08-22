"""GRAPH - Zoetrons semantisches Gedächtnis-Netz (Organ).

Baut aus dem Gedächtnis (facts + events) einen echten Graphen:
- Knoten = Fakten, Artefakte, Ziele
- Kanten = Wortstamm-Ähnlichkeit über Schwelle
- Findet Duplikate und Nachbarn zu jedem Thema.

Lauffähig ohne Argumente (printet Statistik als JSON).
Teil der Werkzeugkiste -> Reflex-Pfad kann ihn nutzen.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


def _terms(text: str) -> set[str]:
    """Wortstamm-Terme: laenger als 4 Zeichen, lowercase."""
    return {w[:7] for w in re.split(r"[^\w]+", text.lower())
            if len(w) > 4}


class KnowledgeGraph:
    def __init__(self, data_dir: str | Path = "data",
                 threshold: float = 0.34) -> None:
        self.data_dir = Path(data_dir)
        self.threshold = threshold
        self.nodes: dict[str, set[str]] = {}   # id -> terms
        self.labels: dict[str, str] = {}       # id -> label
        self.edges: dict[str, set[str]] = defaultdict(set)

    def load(self) -> "KnowledgeGraph":
        fpath = self.data_dir / "memory" / "facts.jsonl"
        if fpath.exists():
            for line in fpath.read_text().splitlines():
                if not line.strip():
                    continue
                try:
                    f = json.loads(line)
                except json.JSONDecodeError:
                    continue
                key = str(f.get("key", ""))[:120]
                if not key:
                    continue
                nid = f"f:{hash(key) % 10**12}"
                self.nodes[nid] = _terms(key + " "
                                         + str(f.get("value", ""))[:400])
                self.labels[nid] = key
        epath = self.data_dir / "memory" / "events.jsonl"
        if epath.exists():
            for line in epath.read_text().splitlines()[-500:]:
                if not line.strip():
                    continue
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                p = e.get("payload", {})
                title = str(p.get("title") or p.get("goal_title")
                            or p.get("goal") or "")[:120]
                if not title:
                    continue
                nid = f"e:{e.get('kind','?')}:{int(e.get('ts', 0))}"
                self.nodes[nid] = _terms(title)
                self.labels[nid] = f"[{e.get('kind')}] {title}"
        return self

    def link(self) -> int:
        """Kanten zwischen Knoten mit Aehnlichkeit > threshold."""
        ids = list(self.nodes)
        for i, a in enumerate(ids):
            ta = self.nodes[a]
            if not ta:
                continue
            for b in ids[i + 1:]:
                tb = self.nodes[b]
                if not tb:
                    continue
                inter = len(ta & tb)
                union = len(ta | tb)
                if union and inter / union >= self.threshold:
                    self.edges[a].add(b)
                    self.edges[b].add(a)
        return sum(len(v) for v in self.edges.values()) // 2

    def duplicates(self) -> list[tuple[str, str]]:
        """Paare mit sehr hoher Aehnlichkeit (= moegliche Dubletten)."""
        out = []
        seen = set()
        for a, ns in self.edges.items():
            for b in ns:
                pair = tuple(sorted((a, b)))
                if pair in seen:
                    continue
                seen.add(pair)
                inter = self.nodes[a] & self.nodes[b]
                union = self.nodes[a] | self.nodes[b]
                if union and len(inter) / len(union) >= 0.55 \
                        and self.labels[a][:60] != self.labels[b][:60]:
                    out.append(pair)
        return out

    def neighbors(self, query: str, max_n: int = 5) -> list[str]:
        """Naechste Nachbarn zu einem Thema (Stichwort)."""
        q = _terms(query)
        scored = sorted(
            ((len(q & t) / max(len(q | t), 1), nid)
             for nid, t in self.nodes.items()),
            reverse=True)
        hits = [nid for s, nid in scored if s >= self.threshold][:max_n]
        out: list[str] = []
        for nid in hits:
            out.append(self.labels[nid])
            out.extend(self.labels[n] for n in list(self.edges[nid])[:2])
        return out[:max_n * 3]

    def stats(self) -> dict:
        deg = sorted((len(v) for v in self.edges.values()), reverse=True)
        return {
            "knoten": len(self.nodes),
            "kanten": sum(len(v) for v in self.edges.values()) // 2,
            "duplikat_paare": len(self.duplicates()),
            "max_grad": deg[0] if deg else 0,
            "isolierte_knoten": sum(1 for i in self.nodes
                                    if not self.edges.get(i)),
        }


def main() -> None:
    base = Path(__file__).resolve().parents[2]
    g = KnowledgeGraph(base / "data").load()
    kanten = g.link()
    dupes = g.duplicates()
    print(json.dumps({
        **g.stats(),
        "beispiel_duplikate": [
            [g.labels[a][:55], g.labels[b][:55]] for a, b in dupes[:4]],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
