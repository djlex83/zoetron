#!/usr/bin/env python3
"""GitHub feature toolkit for Zoetron.

Uses the stored fine-grained token (~/.git-credentials) for:
  issues   - self-managed task board (create works; close needs
             the token permission 'Issues: Read and write')
  releases - tag + publish a release with notes (needs Contents RW, OK)
  labels   - label vocabulary for DRIVE goals / critic findings

Usage:
  python scripts/gh_tools.py issue "Titel" "Body" [label,label]
  python scripts/gh_tools.py release v0.1.1 "Notizen"
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

CREDS = Path.home() / ".git-credentials"
REPO = "djlex83/zoetron"
API = f"https://api.github.com/repos/{REPO}"


def _token() -> str:
    for line in CREDS.read_text().splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("kein Token in ~/.git-credentials")


def _api(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    req = urllib.request.Request(
        f"{API}{path}", method=method,
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"Bearer {_token()}",
                 "Accept": "application/vnd.github+json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            text = r.read().decode()
            return r.status, json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def ensure_labels() -> None:
    """Create Zoetron's label vocabulary (idempotent)."""
    labels = {
        "drive-goal": ("aus Neugier entstanden", "f9d0c4"),
        "dream-insight": ("aus dem Schlaf destilliert", "c5def5"),
        "critic-finding": ("vom Critic bemängelt", "fef2c0"),
        "evolution": ("durch Selektion entstanden", "d4c5f9"),
        "organ": ("betrifft ein Organ", "e4e669"),
    }
    for name, (desc, color) in labels.items():
        code, _ = _api("POST", "/labels",
                       {"name": name, "description": desc, "color": color})
        print(f"label {name}: {'ok' if code in (201,) else code}")


def new_issue(title: str, body: str = "", labels: str = "") -> None:
    payload: dict = {"title": title[:200], "body": body[:4000]}
    if labels:
        payload["labels"] = [l.strip() for l in labels.split(",") if l.strip()]
    code, data = _api("POST", "/issues", payload)
    print(f"issue #{data.get('number', '?')}: HTTP {code}")


def release(tag: str, notes: str) -> None:
    code, data = _api("POST", "/releases",
                      {"tag_name": tag, "name": f"Zoetron {tag}",
                       "body": notes[:8000], "draft": False,
                       "prerelease": False})
    print(f"release: HTTP {code} -> {data.get('html_url') or data.get('message')}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "issue":
        new_issue(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "",
                  sys.argv[4] if len(sys.argv) > 4 else "")
    elif cmd == "labels":
        ensure_labels()
    elif cmd == "release":
        release(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
    else:
        print(__doc__)
