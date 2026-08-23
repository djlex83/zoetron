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
# Zuerst: haengende Commits von frueheren Fehlversuchen loswerden
if ! git pull --rebase origin master >/dev/null 2>&1; then
  git pull --rebase origin main >/dev/null 2>&1 || true
fi
PUSH_VORAB=0
for BRANCH in master main; do
  if git push origin "$BRANCH" >/dev/null 2>&1; then PUSH_VORAB=1; break; fi
done
[ "$PUSH_VORAB" = "1" ] && log "wiki Rueckstand nachgeholt"
cp -f "$SRC"/*.md ./
git add -A
if git diff --cached --quiet; then
  log "wiki unverändert"
else
  git commit -q -m "wiki-sync from docs/wiki [zoetron]"
  PUSH_OK=0
  for BRANCH in master main; do
    # Erst rebase (Wettlauf mit parallelen Pushes), dann pushen,
    # bei Reject einmal wiederholen - sonst bleibt es lokal haengen.
    if git push origin "$BRANCH" >/dev/null 2>&1; then
      PUSH_OK=1; break
    fi
    git pull --rebase origin "$BRANCH" >/dev/null 2>&1 || true
    if git push origin "$BRANCH" >/dev/null 2>&1; then
      PUSH_OK=1; break
    fi
  done
  if [ "$PUSH_OK" = "1" ]; then
    log "wiki gepusht"
  else
    log "wiki-push fehlgeschlagen"
  fi
fi
