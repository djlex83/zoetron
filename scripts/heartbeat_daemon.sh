#!/usr/bin/env bash
# Zoetron in-Hermes heartbeat daemon.
# Runs the full organ cycle every 30 minutes, forever, from THIS machine
# (Hermes host) - no external scheduler needed. Logs to data/heartbeat.log.
set -u
cd /workspace/zoetron
LOG=data/heartbeat.log
PY=.venv/bin/python

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "daemon gestartet (pid $$)"

while true; do
  log "=== HERZSCHLAG BEGINN ==="

  log "phase: reflex"
  REFLEX_OUT=$($PY -m zoetron.reflex 2>&1) || true
  log "$REFLEX_OUT"
  if echo "$REFLEX_OUT" | grep -q '"repairs": \[{' ; then
    git add -A && git commit -q -m "reflex: auto-repair [hermes-daemon]" && \
      git push origin main 2>>"$LOG" && log "reflex-reparatur gepusht"
  fi

  log "phase: prune"
  $PY -m zoetron.cli prune >> "$LOG" 2>&1 || true

  log "phase: dream"
  timeout 420 $PY -m zoetron.cli dream --lookback 120 >> "$LOG" 2>&1 || true

  log "phase: drive"
  timeout 420 $PY -m zoetron.cli drive >> "$LOG" 2>&1 || true

  log "phase: act"
  timeout 900 $PY -m zoetron.cli act >> "$LOG" 2>&1 || true

  log "phase: telegram-bericht"
  SUMMARY=$($PY - <<'PYEOF' 2>/dev/null
import json, time
from pathlib import Path
ev = [json.loads(l) for l in Path('data/memory/events.jsonl').read_text().splitlines()]
ev.sort(key=lambda e: float(e.get('ts', 0)))
recent = ev[-25:]
kinds = {}
for e in recent:
    kinds[e['kind']] = kinds.get(e['kind'], 0) + 1
dream = [e for e in recent if e['kind'] == 'dream_finished']
goals = [str((e.get('payload') or {}).get('title', '')) for e in recent if e['kind'] == 'drive_goal']
acts = [e for e in recent if e['kind'] == 'act_done']
last_act = ''
if acts:
    p = acts[-1].get('payload') or {}
    last_act = f"{str(p.get('goal_title',''))[:50]} -> Score {p.get('score')}"
lines = [
    f"Herzschlag {time.strftime('%H:%M', time.gmtime())} UTC:",
    f"Dream: {'ok' if dream else 'ruht'} | Ziele: {len(goals)} | ACT: {last_act or 'kein neues Ziel'}",
]
g = goals[-1] if goals else 'keins'
lines.append(f"Neugier-Ziel: {g[:70]}")
print('\n'.join(lines))
PYEOF
)
  if [ -n "$SUMMARY" ]; then
    bash scripts/tg_post.sh <<< "$SUMMARY" >> "$LOG" 2>&1 || log "telegram-fehl"
  fi

  log "phase: gedachtnis-ansicht"
  $PY scripts/memory_view.py >> "$LOG" 2>&1 || true

  log "phase: git-pflege"
  CHANGED=$(git status --porcelain | wc -l)
  if [ "$CHANGED" -gt 0 ]; then
    git add -A
    git commit -q -m "herzschlag: organzyklus + gedächtnis-sync [hermes-daemon]"
    git push origin main >> "$LOG" 2>&1 && log "gepusht ($CHANGED dateien)" || log "push-fehler"
  fi

  log "phase: graph"
  $PY src/zoetron/graph.py >> "$LOG" 2>&1 || log "graph-fehler"

  log "phase: wiki-sync"
  bash scripts/wiki_sync.sh

  log "=== HERZSCHLAG ENDE ==="
  sleep 1200
done
