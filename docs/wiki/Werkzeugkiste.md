# 🔧 Die Werkzeugkiste (`data/tools/`)

**Was das ist:** Zoetrons Hände-Artefakte, die sich bewährt haben. Jede
Datei ist ein **eigenständig lauffähiges Python-Skript**, das der Organismus
selbst gebaut (HANDS/EVOLUTION) und im Sandbox-Test ausgeführt hat.
Erfolgreiche Skripte werden hier registriert – das ist seine
**prozedurale Erinnerung**: Nicht wissen, *dass* etwas geht, sondern
*wie* es geht.

## Wie ein Werkzeug benutzt wird

1. **Automatisch (REFLEX-Pfad):** Vor jedem LLM-Durchlauf prüft der ACT-Schritt,
   ob ein Werkzeug zum aktuellen Ziel passt (Wortüberlappung Titel ↔ Dateiname).
   Passt es → Ausführung, **0 Token**, Ergebnis geht nach Telegram. Log:
   `data/memory/events.jsonl` → `reflex_used`.
2. **Manuell:** `.venv/bin/python data/tools/<name>.py`

## Aktuelle Werkzeuge

| Werkzeug | Was es tut | Bewährung |
|---|---|---|
| `dedup_skill_proposals.py` | Dedupliziert Skill-Vorschläge: findet `swarm_artifact:`-Fakten mit sehr ähnlichen Schlüsseln (>60 % Schnitt) und archiviert Dubletten nach `data/memory/dedup_archiv.json` | 11 automatische Läufe |
| `ci-pipeline-reparieren-und-simulation-va.py` | Repariert CI-Pipeline-Konfigurationen und validiert die Reparatur per Trocken-Simulation, bevor sie aktiv wird | 2 automatische Läufe |

*Diese Seite pflegt der Organismus selbst (HANDS → Registry).*
