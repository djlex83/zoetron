# 🫀 Zoetron

[🇬🇧 English version](README.md)

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
| 💓 HERZ | Herzschlag | `heartbeat_daemon.sh` | alle **20 Min**: REFLEX → PRUNE → DREAM → DRIVE → ACT (+HÄNDE) → GRAPH → Bericht |
| 🔥 DRIVE | Neugier/Trieb | `drive.py` | generiert **eigene Ziele** aus Gedächtnislücken – auf Deutsch mit verständlichem „Why" |
| 💭 DREAM | Schlaf/Replay | `dream.py` | destilliert Erlebnisse zu dauerhaften Einsichten + Skill-Vorschlägen |
| 🪞 METACOG | Selbstgefühl | `metacog.py` | sagt eigenen Score voraus, misst Kalibrierung |
| 🌍 SIMULATE | Weltmodell | `simulate.py` | trocken üben vor dem Handeln, Risiken vorab |
| 👁 SINNE | Augen/Ohren | `senses.py` | beobachtet HN-Frontier + Websuche; frische Signale speisen DRIVE |
| ✋ HÄNDE | Motorik | `hands.py` | führt Artefakt-Code in der Sandbox aus; **Erfolge werden wiederverwendbare Werkzeuge** (`data/tools/`) |
| 🧬 EVOLUTION | Fortpflanzung | `evolution.py` | N Varianten → Critic wählt den Fitnessten; Sieger vererben sich, **Verlierer werden Verbots-Liste (Anti-Patterns)** |
| 🩸 STOFFWECHSEL | Stressachse | `metabolism.py` | Rate-Limits/Timeouts erhöhen Stress → kleinere Pläne |
| ✂️ PRUNE | Apoptose | `prune.py` | archiviert alte Erinnerungen, behält genutzte Fakten |
| 🧬 AUTOROUTER | Immunsystem | `router.py` | nur freie Modelle MIT Tool-Support; Failover + Blacklist |
| 🛡 CRITIC | Abwehr | `swarm.py` | Qualitätsgate (Score 0–10); **verlangt lauffähigen Code, keine Prosa** |
| 🕸 GRAPH | Assoziationsrinde | `graph.py` | echtes Wissensnetz über das gesamte Gedächtnis (**368 Knoten / 245 Kanten**), Duplikat-Erkennung, Nachbarschaftssuche |
| ⚡ REFLEX-PFAD | Rückenmark | ACT-Logik | prüft die Werkzeugkiste **bevor** das LLM denkt – token-freie Läufe für Bekanntes |
| 💬 FLÜSTER-KANAL | Menschenstimme | `data/fluester_goals.json` | menschliche Prioritätsziele springen in der Queue nach vorn (`drive_whisper`) |
| 🧠 Gedächtnis | Hippocampus | `memory.py` | JSONL-Fakten + Ereignis-Log + Keyword-Recall |

## Der autonome Kreislauf

Alle 20 Minuten läuft Zoetron einen vollständigen Entwickler-Zyklus **ohne menschliches Zutun**:

```
DRIVE wählt ein Ziel ──► GitHub-Issue wird automatisch angelegt
                         (Label: status:in-arbeit)
        ──► Swarm plant, baut, bewertet (Score 0–10)
        ──► Score ≥ 8: Issue schließt sich selbst (status:erledigt) ✅
            Score < 8: Evolution züchtet bessere Strategien
                       (status:evolviert), die künftige Läufe erben
```

- **Scoring:** 0–10 von einem adversarialen Critic-LLM; ab 8 = konvergiert.
  Details: [Wiki → Scoring](../../wiki/Scoring)
- **Flüster-Kanal:** Menschen können Prioritätsziele über
  `data/fluester_goals.json` einschleusen – Zoetron führt sie **vor** seiner
  eigenen Neugier aus und protokolliert den Eingriff als `drive_whisper`.
- **Öffentliche Selbstverwaltung:** Issues, Label-Kanban, Releases, Wiki und
  die Landing-Page pflegt der Organismus selbst.

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

Ohne Key: deterministisches Mock-Gehirn, alle 34 Tests komplett offline grün.
`ZOETRON_MODEL=auto` entdeckt automatisch alle kostenlosen Tool-fähigen
OpenRouter-Modelle und lernt aus eigenen Läufen, welche gut sind.

## Warum das existiert

Aktuelle LLM-Agents sind Orakel auf Abruf: eingefrorene Gewichte, keine
eigenen Ziele, kein Schlaf, keine Selbstkenntnis. Zoetron baut die fehlenden
Organe als Software – als offener, selbst-hostbarer Schritt Richtung
kontinuierlich lernender Systeme.

## Status

Früher Prototyp (v0.x), aktive Entwicklung, Design ändert sich schnell.
Erste Live-Läufe haben gezeigt: Der Critic fängt echte Produkt-Inkonsistenzen,
DREAM diagnostiziert eigene Pipeline-Bugs aus Erfahrung, der AutoRouter
überspringt tote Modelle automatisch. **Meilenstein:** Das erste vollautonome
Ziel konvergierte (Score 8/10) und schloss sein eigenes GitHub-Issue – der
komplette Kreislauf *denken → handeln → bewerten → abschließen* läuft
unbemannt bei jedem Herzschlag.

## 🔒 Quellcode-Hinweis

> **Zugang zum Quellcode (2 Stufen):**
> **Stufe 1 – Anfrage:** €10.000 Anfragegebühr. Sie filtert Ernsthaftigkeit:
> **Ohne Gebühr kein Gespräch.** Kontakt: GitHub **@djlex83**.
> **Stufe 2 – Gespräch & Lizenz:** Das Werk ist **deutlich mehr wert** als die
> Anfragegebühr. Preis und Lizenzbedingungen werden ausschließlich persönlich
> verhandelt. Spam und Anfragen ohne Gebühr werden ignoriert.
>
> Alle Rechte vorbehalten.

## Lizenz

Alle Rechte vorbehalten – Nutzung/Kopieren/Weitergabe nur mit
Genehmigung des Autors. Siehe [LICENSE](LICENSE). Anfragen: Issue oder
[@djlex83](https://github.com/djlex83).
