#!/usr/bin/env bash
# Sync docs/wiki/* into the GitHub wiki repo (djlex83/zoetron.wiki).
# Idempotent: only pushes when content changed. Safe when wiki disabled.
set -u
SRC=/workspace/zoetron/docs/wiki
WIKI=/workspace/zoetron_wiki
LOG=/workspace/zoetron/data/heartbeat.log

log() { echo "[$(date -u '+%H:%M:%S')] wiki: $*" >> "$LOG" 2>/dev/null || true; }

if [ ! -d "$WIKI/.git" ]; then
  rm -rf "$WIKI"
  if ! git clone -q "https://github.com/djlex83/zoetron.wiki.git" "$WIKI" 2>/dev/null; then
    log "wiki existiert noch nicht auf GitHub – übersprungen"
    exit 0
  fi
fi

cd "$WIKI"
git config user.name "zoetron-bot"
git config user.email "zoetron@users.noreply.github.com"
cp -f "$SRC"/*.md ./
git add -A
if git diff --cached --quiet; then
  log "wiki unverändert"
else
  git commit -q -m "wiki-sync from docs/wiki [zoetron]"
  if git push origin master >/dev/null 2>&1 || git push origin main >/dev/null 2>&1; then
    log "wiki gepusht"
  else
    log "wiki-push fehlgeschlagen"
  fi
fi
