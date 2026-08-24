# Betrieb

## Herzschlag (in Hermes)

Der Daemon läuft als Hintergrundprozess auf dem Hermes-Host:

```
bash scripts/heartbeat_daemon.sh   # alle 15 Min: REFLEX→PRUNE→DREAM→DRIVE→ACT→TG→GRAPH→IDEEN→RETRO→WILLE→GENOM→LEHREN→SELBSTLERNEN→Push
```

**Takt:** 15 Minuten (~96 Zyklen/Tag). Telegram-Berichte einmal je Schlag
(~15 Min). Gemessen am 24.08.2026: 10,3 LLM-Aufrufe je Herzschlag bei 33,5 s
Antwortzeit – ein 5-Minuten-Takt war nie einhaltbar und sprengte mit ~2.965
Aufrufen/Tag das freie Kontingent von 1.000 um das Dreifache.

Log: `data/heartbeat.log`

## Drosseln (gegen Doppler-Spam)

| Kanal | Drossel | Datei |
|---|---|---|
| WILLE-Missionen | 6 h zwischen Anstößen | im `will.py` |
| REFLEX (Ziel+Werkzeug) | 6 h pro Kombination | `data/memory/reflex_last.json` |
| TELEGRAM-Bericht | jeder 3. Herzschlag | Zähler im Daemon |

## Ideen-Board

Bei jedem Herzschlag schreibt `ideen.py` seine eigenen autonomen
Ideen (letzte 72 h) nach `data/IDEEN.md` und `docs/wiki/Ideen.md`:
Fähigkeits-Wünsche mit Häufigkeit, selbstgewählte Ziele, Traum-Erkenntnisse.
Idee gut gefunden? Flüster-Kanal (`data/fluester_goals.json`) – dann baut er sie.

## Crons in dieser Umgebung

Der eingebaute Scheduler feuert hier nicht zuverlässig – deshalb übernimmt
der Daemon den Takt. Die registrierten Jobs (`Zoetron-*`) bleiben als
Schnittstelle erhalten.

## Telegram

`scripts/tg_post.sh` liest `secrets/tg.txt` (Zeile 1: Bot-Token,
Zeile 2: Chat-ID). Jeder dritte Herzschlag schickt eine Kurzzusammenfassung;
Reflex-Erfolge posten direkt (gedrosselt).

## CLI-Referenz

```
python -m zoetron.cli run "Ziel"     # Swarm-Auftrag
python -m zoetron.cli act            # neuestes Ziel ausführen
python -m zoetron.cli dream/drive/prune/models/status
python -m zoetron.cli evolve "Problem" --n 3
python -m zoetron.cli hands "Aufgabe"
```
