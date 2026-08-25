# Architektur

Zoetron ist kein Framework, sondern ein **Organismus**: Zustand liegt im
Gedächtnis (`data/memory/`), Verhalten in Organen (`src/zoetron/*.py`),
Taktgebung im Herzschlag-Daemon.

```
            ┌─────────────── HERZ (30 min) ──────────────┐
            ▼                                            │
  REFLEX ─► PRUNE ─► DREAM ─► DRIVE ─► ACT(Swarm) ─► Telegram/Git
    │         │        │        │         │            ▼
  heilt     vergisst lernt   wählt   führt aus   GRAPH+3D-GEHIRN
            Altes   Muster  Ziele   (PLAN►BUILD►CRITIC)
                                       │                 ▼
                              bei Misserfolg:      RETRO ─► WILLE ─► GENOM
                              EVOLUTION erbt            │        │
                                 ▼                      ▼        ▼
                        strategy/anti_pattern    LEHREN ─► SELBSTLERNEN
                  (in jeden Planner-Prompt)     creator_   statistische
                                                teachings  Policy-Lernen
```

## Die drei Ebenen der Verhaltenssteuerung

1. **GENOM** (angeboren): 5 Instinkt-Regeln in *jedem* Prompt, unantastbar.
2. **LEHRER** (unterwiesen): `creator_teaching:`-Fakten aus
   `data/lehrer.json` – direkte Weisung des Erschaffers.
3. **ERFAHRUNG** (gelernt): strategy-/anti_pattern-/retro_lesson-Fakten,
   vererbt durch EVOLUTION, bestätigt durch SELBSTLERNEN-Statistik.

Alles drei landet in jedem Planner-Prompt – oben die DNA, dann die
Unterweisung, dann das semantische Gedächtnis und die Statistik.

## Gedächtnis-Zuflüsse

| Quelle | Kanal | Landet als |
|---|---|---|
| Eigenes Erleben | Herzschlag (ACT/HANDS/SWARM) | events + facts |
| Erschaffer-Wissen | `data/lehrer.json` | `creator_teaching:` |
| Erschaffer-Ziele | `data/fluester_goals.json` | drive_whisper |
| Eigene Auswertung | selflearn.py | `strategy:`/`anti_pattern:` |
| Selbstkritik | retro.py | `retro_lesson:` |

## Ansichten des Gedächtnisses

- **2D-Graph** (`docs/graph.html`): Physik-Layout, Pan/Zoom, Dubletten
  automatisch verschmolzen, Alters-Farbverlauf (neu=grün → alt=grau).
- **3D-Gehirn** (`docs/brain.html`): zwei Hemisphären (Fakten/Ziele),
  Synapsen-Pulse wie Aktionspotenziale, Klick leuchtet Verbindungen gold.

Beide werden bei jedem Herzschlag neu gebaut und auf GitHub Pages
veröffentlicht.
