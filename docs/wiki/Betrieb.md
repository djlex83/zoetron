# Betrieb

## Herzschlag (in Hermes)

Der Daemon läuft als Hintergrundprozess auf dem Hermes-Host:

```
bash scripts/heartbeat_daemon.sh   # alle 30 Min: REFLEX→PRUNE→DREAM→DRIVE→ACT→TG→Push
```

Log: `data/heartbeat.log`

## Crons in dieser Umgebung

Der eingebaute Scheduler feuert hier nicht zuverlässig – deshalb übernimmt
der Daemon den Takt. Die registrierten Jobs (`Zoetron-*`) bleiben als
Schnittstelle erhalten.

## Telegram

`scripts/tg_post.sh` liest `secrets/tg.txt` (Zeile 1: Bot-Token,
Zeile 2: Chat-ID). Jeder Herzschlag schickt eine Kurzzusammenfassung.

## CLI-Referenz

```
python -m zoetron.cli run "Ziel"     # Swarm-Auftrag
python -m zoetron.cli act            # neuestes Ziel ausführen
python -m zoetron.cli dream/drive/prune/models/status
python -m zoetron.cli evolve "Problem" --n 3
python -m zoetron.cli hands "Aufgabe"
```
