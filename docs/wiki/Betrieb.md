# Betrieb

## Herzschlag (in Hermes)

Der Daemon läuft als Hintergrundprozess auf dem Hermes-Host:

```
bash scripts/heartbeat_daemon.sh   # alle 30 Min: REFLEX→PRUNE→DREAM→DRIVE→ACT→FUSSBALL→WILLE→GENOM→LEHREN→SELBSTLERNEN→TG→IDEEN→BESTENLISTE→GRAPH→SELBSTDIAGNOSE→RETRO→Push
```

**Takt:** 30 Minuten (48 Zyklen/Tag, `TAKT=1800`), Telegram einmal je Schlag.

Die Zahl kommt aus Messung, nicht aus Gefühl. Ein Schwarm-Zyklus braucht rund
zehn Modellaufrufe; das bevorzugte Modell antwortet in ~124 s. Bei einer
ACT-Zeitgrenze von 900 s liefen **26 von 29 Läufen in den Timeout** – in acht
Stunden entstanden drei bewertete Ergebnisse statt der sonst üblichen fünfzig.
Jetzt 1.800 s für ACT: weniger Zyklen, aber fertige. Rund 360 Modellaufrufe
pro Tag liegen zudem weit unter dem freien Kontingent von 1.000.

Log: `data/heartbeat.log`

## Drosseln (gegen Doppler-Spam)

| Kanal | Drossel | Datei |
|---|---|---|
| WILLE-Missionen | 6 h zwischen Anstößen | im `will.py` |
| REFLEX (Ziel+Werkzeug) | 6 h pro Kombination | `data/memory/reflex_last.json` |
| TELEGRAM-Bericht | jeder Herzschlag | Zähler im Daemon (Teiler 1) |

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
