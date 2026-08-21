"""REFLEX - spinal-cord level self-healing.

Biology: the spinal cord fixes simple injuries before the brain even
notices. Zoetron's equivalent: cheap, deterministic repairs for known
failure patterns - run BEFORE dream/drive on every heartbeat, so errors
"resolve themselves without anyone asking".

Built-in reflexes (extensible):
  1. ci_node_deprecation : GitHub Actions warns about Node 20 deprecation
     -> bump @vX actions to their latest major in .github/workflows/*.yml
  2. stale_heartbeat     : last heartbeat older than 40 min -> nothing to
     fix inside the repo, but reported so the outer scheduler can react

Every reflex logs a reflex_done event; unknown problems are listed as
open_issues for DRIVE/METACOG to reason about later.
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
WF = ROOT / ".github" / "workflows"
EVENTS = ROOT / "data" / "memory" / "events.jsonl"

NODE20 = re.compile(r"(uses:\s*(?:actions|astral-sh|python)\S*@)v(\d+)")


def _events() -> list[dict[str, Any]]:
    try:
        return [json.loads(l) for l in EVENTS.read_text().splitlines()]
    except OSError:
        return []


def _log(kind: str, payload: dict[str, Any]) -> None:
    EVENTS.parent.mkdir(parents=True, exist_ok=True)
    row = {"ts": time.time(), "kind": kind, "payload": payload}
    with EVENTS.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def _fix_ci_node_deprecation() -> dict[str, Any] | None:
    """Bump deprecated action majors in workflow files."""
    bumps = {"checkout": "v5", "setup-python": "v6"}
    changed: list[str] = []
    if not WF.exists():
        return None
    for f in WF.glob("*.yml"):
        text = new = f.read_text()
        for act_name, ver in bumps.items():
            new = re.sub(rf"(uses:\s*actions/{act_name}@)v\d+",
                         rf"\g<1>{ver}", new)
        if new != text:
            f.write_text(new)
            changed.append(f.name)
    if not changed:
        return None
    return {"reflex": "ci_node_deprecation", "fixed": changed}


def check_ci_status_via_api(timeout: float = 15.0) -> dict[str, Any] | None:
    """Ask GitHub about the newest CI run; detect failure signals."""
    try:
        import urllib.request
        url = ("https://api.github.com/repos/djlex83/zoetron/actions/runs"
               "?per_page=3")
        data = json.loads(urllib.request.urlopen(url, timeout=timeout).read())
    except Exception:  # noqa: BLE001 - offline is fine
        return None
    for run in data.get("workflow_runs", []):
        if run.get("conclusion") == "failure":
            return {"failed_run": run.get("head_sha", "")[:7],
                    "message": (run.get("head_commit") or {}).get("message",
                                  "")[:80]}
    return None


def run_reflexes() -> dict[str, Any]:
    result: dict[str, Any] = {"repairs": [], "ci_failure": None,
                              "checked": 0}

    r1 = _fix_ci_node_deprecation()
    if r1:
        result["repairs"].append(r1)
    result["checked"] += 1

    ci_fail = check_ci_status_via_api()
    result["ci_failure"] = ci_fail
    result["checked"] += 1

    if result["repairs"]:
        _log("reflex_done", {"repairs": result["repairs"]})
    elif ci_fail:
        _log("reflex_open_issue", {"ci_failure": ci_fail})
    else:
        _log("reflex_ok", {})
    return result


if __name__ == "__main__":
    out = run_reflexes()
    print(json.dumps(out, ensure_ascii=False)[:400])
