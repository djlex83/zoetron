# Zoetron – Architektur: Forschungsorganismus für die fehlenden Organe

## Designprinzip: Organismus als Schleife, nicht als Orakel

Heutige LLM-Agents sind Orakel auf Abruf: eingefrorene Gewichte, keine eigenen
Ziele, kein Schlaf, keine Selbstkenntnis. Zoetron baut die fehlende Schicht
darum herum — ein **Subsystem mit geschlossener Rückkopplung**: wahrnehmen →
erinnern → planen → handeln → bewerten → verbessern. Skaliert wird die
Schleife, nicht das Modell.

Das ist bewusst die kleinere Behauptung. Zoetron baut nicht das Gehirn, sondern
erforscht den Körper: Gedächtnis, Antrieb, Schlaf, Identität, Kritik — offene
Forschungsfragen, an denen das ganze Feld noch arbeitet.

## Die vier Phasen

| Phase | Funktion | Implementierung |
|---|---|---|
| 1 ORIENT | Metabolisches Gedächtnis: relevanter Kontext wird „verdaut" | `MemoryStore.digest()` – Fakten + Keyword-Recall |
| 2 PLAN | Zielzerlegung in verifizierbare Aufgaben | LLM-Aufruf mit striktem JSON-Vertrag |
| 3 EXECUTE | Eine Aufgabe → ein Artefakt, begrenzte Wiederholungen | `ForgeAgent._execute()`, max_retries |
| 4 CRITIQUE | Adversariale Selbstbewertung, Score zwingt Iteration | `ForgeAgent._critique()`, Score ≥ 8 = Konvergenz |

## Sicherheitsmodell

1. **Begrenzte Zyklen** (`max_cycles`) – keine unendliche Selbstverbesserung.
2. **Begrenzte Wiederholungen** (`max_retries`) – kein Ressourcen-Hamsterrad.
3. **Nur-Lese-Ziel** – der Agent schreibt ausschließlich in sein eigenes Datenverzeichnis.
4. **Mensch am Ende** – jeder Lauf endet mit einem Bericht (`CycleReport.summary()`).

## Grenzen – was diese Architektur nicht leistet

Zwei Obergrenzen, die im Design stecken und durch keine Zusatz-Organe verschwinden:

1. **Das Lernen erreicht nie die Gewichte.** Zoetron lernt in Text — Fakten,
   Anti-Patterns, Strategien. Das verbessert die *Nutzung* des LLM, nicht das LLM.
   Die Intelligenz-Obergrenze ist exakt das beste Modell, das der AutoRouter erreicht.
2. **Kritiker-Decke.** Ein System verbessert sich nicht verlässlich über das
   Verständnis seines eigenen Prüfers hinaus — und der Critic ist selbst ein LLM.
   Deshalb zählt Selbstverbesserung nur dort wirklich, wo der Prüfer nicht irren kann:
   Code mit Tests, Backtests, messbare Benchmarks.

## Pfad zu echtem Multi-Agent (Phase 2 des Projekts)

- Planner/Builder/Critic als **getrennte LLM-Instanzen** mit eigenen Systemprompts
  (Rollen siehe `agents/ROLES.md`), gekoppelt über das JSONL-Gedächtnis.
- Später: heterogene Modelle (ox alpha plant, billiges Modell execuiert, teures Modell kritisiert).

## Warum das noch nicht gibt

- Agent-Frameworks verkaufen *Orchestrierung*, aber niemand packt
  **Selbstverbesserung mit Gedächtnis + adversarialer Kritik** als fertige,
  selbst-hostbare, modell-agnostische Schleife in ein Produkt.
- Zoetron = „das Gewissen für jeden Agent-Stack" – anbringbar auf jedem
  OpenAI-kompatiblen Endpoint.
