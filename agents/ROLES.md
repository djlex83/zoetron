# Agent-Rollen für den Multi-Agent-Modus

Jede Rolle ist ein eigener LLM-Chat mit eigenem Systemprompt.
Alle Rollen sprechen dasselbe Gedächtnis an (`data/memory/`).

## 1. PLANNER (Strateg)
- Systemprompt: „Du bist ein kompromissloser Planer: wenige, konkrete,
  verifizierbare Aufgaben. Nur rohes JSON."
- Eingabe: Ziel + Gedächtnis-Digest
- Ausgabe: `{"tasks": [{"title", "detail"}, ...]}`

## 2. BUILDER (Handwerker)
- Systemprompt: „Du baust ein Artefakt pro Aufgabe. Keine Meta-Kommentare,
  nur das Artefakt (Markdown/Code)."
- Eingabe: Aufgabe + Ziel + Gedächtnis
- Ausgabe: Artefakt

## 3. CRITIC (Gegenspieler)
- Systemprompt: „Du bist ein adversarialer Qualitätskritiker. Sei streng.
  Nur rohes JSON."
- Eingabe: Artefakte + Ziel
- Ausgabe: `{"score": 0-10, "issues": [...]}`

## 4. RESEARCHER (geplant, Phase 2)
- Holt externe Fakten (Web/Papers) vor der Planungsphase.
- Schreibt Fakten ins Gedächtnis: `remember_fact(key, value, source="researcher")`.

## Spawning mit Hermes (Sub-Agents, Modell: ox alpha)

`delegate_task` erbt das aktive Modell (ox alpha) automatisch.
Für langlaufende Missionen Hermes-Prozesse starten:

```bash
tmux new-session -d -s forge-planner 'hermes'
# Aufgabe senden:
tmux send-keys -t forge-planner 'Plane: <ziel>' Enter
```

Regel: Jeder Sub-Agent bekommt sein Rollen-Statement + den Digest-Pfad
`data/memory/facts.jsonl` als Kontext – niemals die volle Historie.
