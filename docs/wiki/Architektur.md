# Architektur

Zoetron ist kein Framework, sondern ein **Organismus**: Zustand liegt im
Gedächtnis (`data/memory/`), Verhalten in Organen (`src/zoetron/*.py`),
Taktgebung im Herzschlag-Daemon.

```
            ┌─────────────── HERZ (30 min) ───────────────┐
            ▼                                             │
  REFLEX ─► PRUNE ─► DREAM ─► DRIVE ─► ACT(Swarm) ─► Telegram/Git
    │         │        │        │         │
  heilt     vergisst lernt   wählt   führt aus
            Altes   Muster  Ziele   (PLAN►BUILD►CRITIC)
                                       │
                              bei Misserfolg: EVOLUTION
```

## Datenfluss

1. **SENSES** beobachtet HN-Frontier → Fakten `frontier:*`
2. **DRIVE** erzeugt Ziele aus Lücken + frischen Signalen
3. **SIMULATE** testet Pläne trocken, **METACOG** sagt Scores voraus
4. Swarm baut Artefakte, **CRITIC** scorent
5. Score < 8 → **EVOLUTION** züchtet Alternativen, Sieger wird vererbt
6. **DREAM** destilliert Erlebnisse zu Einsichten, **PRUNE** archiviert Altes
7. Alles landet im Gedächtnis → nächster Zyklus ist schlauer
