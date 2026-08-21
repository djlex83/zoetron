"""SENSES - eyes and ears for the outside world.

Until now Zoetron only dreamed about itself. SENSES looks outward:

  EYE 1 (frontier): Hacker News front page - what is hot right now?
  EYE 2 (search):   DuckDuckGo queries for curiosity follow-ups

Both eyes go through the local scrapling-browser service (anti-bot,
JS rendering) with the cheap `http` engine first. Signals land in
memory as facts (`frontier:*`) so DRIVE can turn them into its own
goals - the organism starts hunting knowledge instead of only naming
its gaps.
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from typing import Any, Callable

from .config import Config
from .memory import MemoryStore

SCRAPLING = "http://scrapling:8701"
HN_API = ("https://hn.algolia.com/api/v1/search?tags=front_page"
          "&hitsPerPage=12&attributesToRetrieve=title,url,objectID")
DDG = "https://html.duckduckgo.com/html/?q={q}"


def _scrapling(url: str, *, css: str | None = None,
               max_chars: int = 4000) -> Any:
    """Fetch through the scrapling service (cheap http engine)."""
    payload: dict[str, Any] = {"url": url, "engine": "http",
                               "max_chars": max_chars}
    if css:
        payload["css"] = css
    req = urllib.request.Request(
        f"{SCRAPLING}/fetch", data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    data = json.loads(urllib.request.urlopen(req, timeout=90).read())
    if not data.get("ok"):
        raise RuntimeError(str(data.get("error", "scrapling failed"))[:120])
    return data.get("css") if css else data.get("text", "")


class Senses:
    def __init__(self, cfg: Config, memory: MemoryStore | None = None,
                 fetch: Callable[..., Any] | None = None):
        self.cfg = cfg
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        self._fetch = fetch or _scrapling

    # -- eye 1: frontier -----------------------------------------------------#
    def see_frontier(self, top_n: int = 3) -> list[dict[str, str]]:
        raw = self._fetch(HN_API, max_chars=60000)
        hits: list[dict[str, Any]] = []
        if isinstance(raw, str):
            try:
                hits = json.loads(raw).get("hits", [])
            except json.JSONDecodeError:
                # tolerate truncation/highlight-bloat: pull pairs by regex
                titles = re.findall(r'"title":"((?:[^"\\]|\\.)*)"', raw)
                urls = re.findall(r'"url":"((?:[^"\\]|\\.)*)"', raw)
                hits = [{"title": t.replace('\\"', '"'), "url": u}
                        for t, u in zip(titles, urls)]
        seen: dict[str, str] = {}
        for h in hits:
            title = str(h.get("title", "")).strip()
            url = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
            if title and title.lower() not in seen:
                seen[title] = url
            if len(seen) >= top_n:
                break
        return [{"title": t, "url": u} for t, u in seen.items()]

    # -- eye 2: search -------------------------------------------------------#
    def search(self, query: str, max_results: int = 4) -> list[str]:
        url = DDG.format(q=urllib.parse.quote(query))
        titles = self._fetch(url, css=".result__a", max_chars=8000)
        clean = [re.sub(r"\s+", " ", t).strip()
                 for t in (titles or [])[:max_results]]
        return [t for t in clean if t]

    # -- integrate -----------------------------------------------------------#
    def look(self, top_n: int = 3) -> dict[str, Any]:
        """One perception cycle: see + remember. Never raises."""
        result: dict[str, Any] = {"frontier": [], "errors": []}
        try:
            result["frontier"] = self.see_frontier(top_n=top_n)
            for i, item in enumerate(result["frontier"], 1):
                self.memory.remember_fact(
                    f"frontier:{time_prefix(i)}",
                    f"{item['title']} ({item['url']})",
                    source="senses")
        except Exception as exc:  # noqa: BLE001 - eyes may fail
            result["errors"].append(f"frontier: {exc}"[:140])
        self.memory.add_event("sense_cycle", {
            "seen": len(result["frontier"]),
            "errors": result["errors"],
        })
        return result

    def curiosity_goals(self, max_n: int = 1) -> list[dict[str, str]]:
        """Turn fresh frontier signals into DRIVE-style goal candidates."""
        goals: list[dict[str, str]] = []
        for f in self.memory.facts():
            if f.get("key", "").startswith("frontier:") \
                    and time.time() - float(f.get("ts", 0)) < 3600:
                title = str(f.get("value", ""))[:100]
                goals.append({
                    "title": f"Investigate: {title.split(' (')[0]}",
                    "why": "Fresh external signal from SENSES; "
                           "high information gain for the organism.",
                })
                if len(goals) >= max_n:
                    break
        return goals


def time_prefix(i: int) -> str:
    import time
    return time.strftime("%H%M", time.gmtime()) + f"-{i}"
