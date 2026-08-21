# 🫀 Zoetron

**Ein autonomer Agent-Organismus, der aus jeder Erfahrung schlauer wird –
auf kostenlosen OpenRouter-Modellen, mit AutoRouter gegen Modell-Sterblichkeit.**

Zoetron ist kein Agent-Framework. Es ist ein **Organismus**: Herzschlag,
Neugier, Schlaf, Weltmodell, Selbstmodell und ein Immunsystem gegen tote Modelle.

```
Ziel ──► PLAN ──► SIMULIEREN ──► SELBSTEINSCHÄTZUNG ──► BAUEN ──► KRITIK
          ▲                                                    │
          └────────── Score < 8: neue Iteration ◄──────────────┘
                     ▼
     JSONL-Gedächtnis (Fakten + Ereignisse) → DREAM destilliert Einsichten
                     ▼
     DRIVE erzeugt die nächsten eigenen Ziele aus Wissenslücken
```

## Die Organe

| Organ | Natur-Vorbild | Datei | Was es tut |
|---|---|---|---|
| 💓 HERZ | Herzschlag | Hermes-Cron | alle 30 Min: DREAM + DRIVE + Status |
| 🔥 DRIVE | Neugier/Trieb | `drive.py` | generiert **eigene Ziele** aus Gedächtnislücken |
| 💭 DREAM | Schlaf/Replay | `dream.py` | destilliert Erlebnisse zu dauerhaften Einsichten |
| 🪞 METACOG | Selbstgefühl | `metacog.py` | sagt eigenen Score voraus, misst Kalibrierung |
| 🌍 SIMULATE | Weltmodell | `simulate.py` | trocken üben vor dem Handeln, Risiken vorab |
| 🧬 AUTOROUTER | Immunsystem | `router.py` | nur freie Modelle MIT Tool-Support; Failover + 1h-Blacklist; **Erfahrung schlägt Papier** (Critic-Scores boosten die Kette) |
| 🛡 CRITIC | Abwehr | `swarm.py` | adversariale Qualitätsgate (Score 0–10) |
| 🧠 Gedächtnis | Hippocampus | `memory.py` | JSONL-Fakten + Ereignis-Log + Keyword-Recall |

## Quickstart

```bash
git clone https://github.com/djlex83/zoetron && cd zoetron
python3 -m venv .venv && .venv/bin/pip install -e .
echo "OPENROUTER_API_KEY=sk-or-..." > .env
echo "ZOETRON_MODEL=auto" >> .env        # AutoRouter = modell-unsterblich

.venv/bin/python -m zoetron.cli run "Dein Ziel" --swarm --save-artifacts out/
.venv/bin/python -m zoetron.cli models   # Routing-Queue live ansehen
.venv/bin/python -m zoetron.cli drive    # eigene Ziele generieren lassen
.venv/bin/python -m zoetron.cli dream    # Schlafphase: Erfahrung konsolidieren
.venv/bin/python -m zoetron.cli status   # Selbstmodell & Kalibrierung
```

Ohne Key: deterministisches Mock-Gehirn, 34 Tests komplett offline grün.
`ZOETRON_MODEL=auto` entdeckt automatisch alle kostenlosen Tool-fähigen
OpenRouter-Modelle und lernt aus eigenen Läufen, welche gut sind.

## Warum das existiert

Aktuelle LLM-Agents sind Orakel auf Abruf: eingefrorene Gewichte, keine eigenen
Ziele, kein Schlaf, keine Selbstkenntnis. Zoetron baut die fehlenden Organe
als Software – als offener, selbst-hostbarer Schritt in Richtung
kontinuierlich-lernender Systeme.

## Status

Früher Prototyp (v0.x), aktive Entwicklung, Design ändert sich schnell.
Erste Live-Läufe haben gezeigt: Der Critic fängt echte Produkt-Inkonsistenzen,
DREAM diagnostiziert eigene Pipeline-Bugs aus Erfahrung, der AutoRouter
überspringt tote Modelle automatisch.

## Lizenz

MIT – siehe [LICENSE](LICENSE).
