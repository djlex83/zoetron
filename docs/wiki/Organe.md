# Organe (Detail)

| Organ | Datei | Aufgabe |
|---|---|---|
| 💓 HERZ | `scripts/heartbeat_daemon.sh` | 15-Minuten-Takt (~96/Tag), fährt alle Phasen: REFLEX → PRUNE → DREAM → DRIVE → ACT → TELEGRAM → GRAPH+3D-GEHIRN → RETRO → WILLE → GENOM → LEHREN → SELBSTLERNEN → git/wiki |
| 🧬 GENOM | `genome.py` | 5 angeborene Instinkt-Regeln (`data/genome.json`) in jedem LLM-Prompt + Selbsterhalt-Watchdog |
| 📖 LEHRER | `teacher.py` | Erschaffer-Wissen (`data/lehrer.json`) wird zu `creator_teaching:`-Fakten – höchste Autorität nach dem Genom |
| 🧠 SELBSTLERNEN | `selflearn.py` | statistisches Lernen ohne LLM: Tool-Erfolgsquoten, Score-Historie → strategy/anti_pattern-Fakten |
| 🕸 SEMANTISCH | `semantic.py` | TF-IDF + Synonymfelder + Cross-Domain-Bridging; Frag das Gedächtnis: `python src/zoetron/semantic.py "Frage"` |
| 🎯 WILLE | `will.py` | Missionen mit messbaren Zielen überdauern Zyklen; Drossel 6 h; Vorfahrt nach Flüster-Zielen |
| 🛡 REFLEX | ACT-Logik in `cli.py` | Werkzeugkiste vor dem LLM; ganze-Wort-Matching gegen Zufalls-Treffer |
| ✂️ PRUNE | `prune.py` | archiviert alte Erinnerungen |
| 💭 DREAM | `dream.py` | destilliert Erlebnisse zu Einsichten + Skill-Vorschlägen |
| 🔥 DRIVE | `drive.py` | eigene Ziele aus Lücken + Sinnesdaten |
| 👁 SENSES | `senses.py` | HN-Frontier + DDG via Scrapling |
| 🔬 RESEARCHER | Swarm-Rolle 4 | frische Web-Fakten vor jeder Planung |
| ✋ HANDS | `hands.py` | führt echten Code in Sandbox aus; Erfolge → Werkzeugkiste (`data/tools/`, siehe Wiki-Seite „Werkzeugkiste") |
| 🧬 EVOLUTION | `evolution.py` | Varianten züchten, Critic wählt, Sieger erbt |
| 🩸 METABOLISM | `metabolism.py` | Stressachse: Rate-Limits → Sparmodus |
| 🪞 METACOG | `metacog.py` | Score-Vorhersage + Kalibrierung |
| 🪞 RETRO | `retro.py` | Selbstkritik nach jedem Schlag; Lehren werden dauerhafte `retro_lesson:`-Fakten |
| 🌍 SIMULATE | `simulate.py` | Weltmodell-Trockentest vor der Ausführung |
| ⚖️ CRITIC | in `swarm.py` | bewertet Artefakte 0–10 |
| 🕸 GRAPH+BRAIN | `graph.py`, `graph_view.py`, `brain_view.py` | Wissensnetz als 2D-Physik-View + 3D-Gehirn (Hemisphären, Synapsen-Pulse, Alters-Farbverlauf) |
| 🧠 Gedächtnis | `memory.py` | JSONL-Fakten + Ereignisse + Recall; auto-dedupliziert |

## Der Swarm-Zyklus

`Planner → Builder → Critic`, bis zu 3 Zyklen. Konvergiert bei Score ≥ 8.
Bei Misserfolg springt EVOLUTION ein und vererbt die Sieger-Strategie
(`strategy:*`-Fakten) an künftige Planner.
