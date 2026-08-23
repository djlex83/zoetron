# Betrieb

## Herzschlag (in Hermes)

Der Daemon läuft als Hintergrundprozess auf dem Hermes-Host:

```
bash scripts/heartbeat_daemon.sh   # alle 5 Min: REFLEX→PRUNE→DREAM→DRIVE→ACT→TG→GRAPH→IDEEN→RETRO→WILLE→GENOM→LEHREN→SELBSTLERNEN→Push
```

**Takt:** 5 Minuten (~288 Zyklen/Tag). Telegram-Berichte nur jeden
3. Schlag (~15 Min) – schnelles Denken, kein Spam.

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
