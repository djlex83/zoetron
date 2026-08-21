# Organe (Detail)

| Organ | Datei | Aufgabe |
|---|---|---|
| 💓 HERZ | `scripts/heartbeat_daemon.sh` | 30-Minuten-Takt, fährt alle Phasen |
| 🛡 REFLEX | `reflex.py` | Selbstheilung (CI-Action-Bumps u. a.) |
| ✂️ PRUNE | `prune.py` | archiviert alte Erinnerungen |
| 💭 DREAM | `dream.py` | destilliert Erlebnisse zu Einsichten + Skill-Vorschlägen |
| 🔥 DRIVE | `drive.py` | eigene Ziele aus Lücken + Sinnesdaten |
| 👁 SENSES | `senses.py` | HN-Frontier + DDG via Scrapling |
| ✋ HANDS | `hands.py` | führt echten Code in Sandbox aus |
| 🧬 EVOLUTION | `evolution.py` | Varianten züchten, Critic wählt, Sieger erbt |
| 🩸 METABOLISM | `metabolism.py` | Stressachse: Rate-Limits → Sparmodus |
| 🪞 METACOG | `metacog.py` | Score-Vorhersage + Kalibrierung |
| 🌍 SIMULATE | `simulate.py` | Weltmodell-Trockentest vor der Ausführung |
| 🧬 AUTOROUTER | `router.py` | freie Modelle entdecken, Erfahrungslernen |
| ⚖️ CRITIC | in `swarm.py` | bewertet Artefakte 0–10 |
| 🧠 Gedächtnis | `memory.py` | JSONL-Fakten + Ereignisse + Recall |

## Der Swarm-Zyklus

`Planner → Builder → Critic`, bis zu 3 Zyklen. Konvergiert bei Score ≥ 8.
Bei Misserfolg springt EVOLUTION ein und vererbt die Sieger-Strategie
(`strategy:*`-Fakten) an künftige Planner.
