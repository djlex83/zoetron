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
| 💓 HERZ | Herzschlag | `heartbeat_daemon.sh` | alle **15 Min** (~96/Tag): REFLEX → PRUNE → DREAM → DRIVE → ACT (+HÄNDE) → TELEGRAM-Beweis → GRAPH+3D-GEHIRN → RETRO → WILLE → GENOM → git/wiki-Sync |
| 🧬 GENOM | angeborene DNA | `genome.py` | **5 Instinkt-Regeln** (`data/genome.json`) in *jedem* LLM-Prompt – schütze Gedächtnis, Erschaffer zuerst, Selbsterhalt-Watchdog, Ehrlichkeit, aus jedem Fehler lernen |
| 🔥 DRIVE | Neugier/Trieb | `drive.py` | generiert **eigene Ziele** aus Gedächtnislücken – auf Deutsch mit verständlichem „Why" |
| 💭 DREAM | Schlaf/Replay | `dream.py` | destilliert Erlebnisse zu dauerhaften Einsichten + Skill-Vorschlägen |
| 🪞 METACOG | Selbstgefühl | `metacog.py` | sagt eigenen Score voraus, misst Kalibrierung |
| 🌍 SIMULATE | Weltmodell | `simulate.py` | trocken üben vor dem Handeln, Risiken vorab |
| 👁 SINNE | Augen/Ohren | `senses.py` | beobachtet HN-Frontier + Websuche; frische Signale speisen DRIVE |
| 🔬 RESEARCHER | Kundschafter | Swarm-Rolle 4 | frische Web-Fakten vor jeder Planung (Phase 2 aus ROLES.md) |
| 🕸 SEMANTISCH | Bedeutungsrinde | `semantic.py` | TF-IDF + Synonym-Felder + **Cross-Domain-Bridging**: findet verwandtes Wissen *nach Bedeutung*, nicht nach Wortlaut – in jedem Plan |
| ✋ HÄNDE | Motorik | `hands.py` | führt Artefakt-Code in der Sandbox aus; **Erfolge werden wiederverwendbare Werkzeuge** (`data/tools/`) |
| 🧬 EVOLUTION | Fortpflanzung | `evolution.py` | N Varianten → Critic wählt den Fitnessten; Sieger vererben sich, **Verlierer werden Verbots-Liste (Anti-Patterns)** |
| 🩸 STOFFWECHSEL | Stressachse | `metabolism.py` | Rate-Limits/Timeouts erhöhen Stress → kleinere Pläne |
| ✂️ PRUNE | Apoptose | `prune.py` | archiviert alte Erinnerungen, behält genutzte Fakten |
| 🎯 WILLE | Stirnlappen | `will.py` | langfristige **Missionen** mit messbaren Zielen überdauern Zyklen; haben Vorfahrt vor kurzer Neugier (Flüstern gewinnt weiter) |
| 🪞 RETRO | Gewissen | `retro.py` | reviewt nach jedem Schlag die eigenen Zyklen: ehrliche Befunde werden `retro_lesson:`-Fakten und speisen den nächsten Planner-Prompt |
| 🕸 GRAPH+GEHIRN | Assoziationsrinde | `graph.py`, `graph_view.py`, `brain_view.py` | Live-Wissensnetz (2D-Physik-View + **3D-Gehirn** mit Hemisphären & Synapsen-Pulsen), Dubletten automatisch verschmolzen |
| ⚡ REFLEX-PFAD | Rückenmark | ACT-Logik | prüft die Werkzeugkiste **bevor** das LLM denkt – token-freie Läufe für Bekanntes |
| 🛡 CRITIC | Abwehr | `swarm.py` | Qualitätsgate (Score 0–10); **verlangt lauffähigen Code, keine Prosa** |
| 💬 FLÜSTER-KANAL | Menschenstimme | `data/fluester_goals.json` | menschliche Prioritätsziele springen in der Queue nach vorn (`drive_whisper`) |
| 🧠 Gedächtnis | Hippocampus | `memory.py` | JSONL-Fakten + Ereignis-Log + Keyword-Recall; automatisch dedupliziert |

## Der autonome Kreislauf

Alle **15 Minuten** (~96 Zyklen/Tag) läuft Zoetron einen vollständigen
Entwickler-Zyklus **ohne menschliches Zutun** – und denkt dabei über sich
selbst nach:

```
HERZSCHLAG (alle 15 Min)
 ├─ ⚡ REFLEX   Werkzeugkiste zuerst – Bekanntes läuft ohne Token
 ├─ ✂️ PRUNE    alte Erinnerungen archivieren
 ├─ 💭 DREAM    neue Einsichten + Skill-Ideen aus frischen Erfahrungen
 ├─ 🔥 DRIVE    wählt sein nächstes Ziel (Neugier) oder ein Flüster-Ziel (du)
 ├─ 🐜 ACT      Swarm plant → baut → Critic bewertet 0–10
 │     Score ≥ 8: Issue schließt sich selbst (status:erledigt) ✅
 │     Score < 8: Evolution züchtet Strategien, Verlierer werden
 │                Verbotsliste (Anti-Patterns), Sieger werden vererbt
 ├─ ✋ HÄNDE    Artefakt-Code in der Sandbox ausgeführt; Erfolge werden Tools
 ├─ 📱 TELEGRAM postet den Ausführungs-Beweis (Werkzeug + Ergebnis)
 ├─ 🕸 GRAPH    baut den Live-Wissensgraph über das gesamte Gedächtnis neu
 └─ 🪞 RETRO   reviewt die eigenen Zyklen: „was lief gut / schlecht?"
               Lehren wandern ins Gedächtnis für künftige Planner
```

- **Scoring:** 0–10 von einem adversarialen Critic-LLM; ab 8 = konvergiert.
  Details: [Wiki → Scoring](../../wiki/Scoring)
- **Flüster-Kanal:** Menschen können Prioritätsziele über
  `data/fluester_goals.json` einschleusen – Zoetron führt sie **vor** seiner
  eigenen Neugier aus und protokolliert den Eingriff als `drive_whisper`.
- **Öffentliche Selbstverwaltung:** Issues, Label-Kanban, Releases, Wiki und
  die Landing-Page pflegt der Organismus selbst.

### 💡 Was es alle 15 Minuten denkt

Jeder Herzschlag erzeugt frische Ideen, die öffentlich wachsen:

| Phase | Typische Ideen dabei |
|---|---|
| 💭 DREAM | destillierte Einsichten („was habe ich seit dem letzten Schlag gelernt?") + konkrete Skill-Vorschläge |
| 🔥 DRIVE | ein brandneues Ziel mit verständlichem deutschem *Why* – gewählt, weil das Gedächtnis dort eine Lücke hat |
| 🐜 ACT | lauffähige Python-Artefakte je Task (Code ist Pflicht, Prosa allein gibt schlechte Scores) |
| 🧬 EVOLUTION | bis zu 3 grundverschiedene Angriffswinkel pro Fehlschlag; der Fitnesste wird Erbstrategie |
| 🪞 RETRO | ehrliche Selbstbefunde wie *„Durchschnitts-Score nur 1,5/10 – Code-Pflicht greift noch zu schwach"* oder *„N Hände-Fehlschläge – baue kleinere eigenständige Skripte"* |

Echte Beispiele aus dem Gedächtnis: *„MemoryStore als selbst-prunenden
Ring-Puffer neu entwerfen"*, *„Embedding-getriebene Organ-Integration: BFS
durch gelernte Ähnlichkeit ersetzen"*, *„MemoryStore-Vertragsprüfer vor jedem
Hände-Batch erzwingen; früh und laut scheitern."*

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

> Der Code ist nicht öffentlich (gesperrter Bereich).
> **Lizenz & Zusammenarbeit nur auf seriöse, schriftliche Anfrage** über GitHub
> **@djlex83** – mit echtem Namen, Hintergrund und konkretem Anliegen.
> Formlose Massen-Nachrichten, Werbeangebote und „Preis?“-One-Liner werden
> ignoriert. Lizenzvergabe erfordert Vertrag + NDA. Alle Rechte vorbehalten.

## Lizenz

Alle Rechte vorbehalten – Nutzung/Kopieren/Weitergabe nur mit
Genehmigung des Autors. Siehe [LICENSE](LICENSE). Anfragen: Issue oder
[@djlex83](https://github.com/djlex83).
