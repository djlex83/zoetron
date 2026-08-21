#!/usr/bin/env bash
# Post a message to Telegram via the Zoetron bot.
# Config file (default /workspace/zoetron/secrets/tg.txt):
#   line 1: bot token
#   line 2: chat id (user or channel)
# Exits silently when not configured - heartbeat never breaks.
CFG="${ZOETRON_TG_CFG:-/workspace/zoetron/secrets/tg.txt}"
[ -f "$CFG" ] || exit 0
TOKEN=$(sed -n 1p "$CFG" | tr -d '[:space:]')
CHAT=$(sed -n 2p "$CFG" | tr -d '[:space:]')
case "$TOKEN" in ""|HIER*|"DEIN"*) exit 0 ;; esac
case "$CHAT" in ""|HIER*|"DEIN"*) exit 0 ;; esac
TEXT=$(cat)
curl -s --max-time 20 -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d chat_id="$CHAT" --data-urlencode text="$TEXT" >/dev/null
