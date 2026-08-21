# Zoetron – ASI-Architektur-Blaupause

## Designprinzip: ASI als Schleife, nicht als Orakel

Echte Superintelligenz wird nicht als einzelnes Modell entstehen, sondern als
**Subsystem mit geschlossener Rückkopplung**: wahrnehmen → erinnern → planen →
handeln → bewerten → verbessern. Zoetron implementiert genau diesen Kern
heute mit LLMs als Bausteinen und skaliert die Schleife, nicht das Modell.

## Die vier Phasen

| Phase | Funktion | Implementierung |
|---|---|---|
| 1 ORIENT | Metabolisches Gedächtnis: relevanter Kontext wird „verdaut" | `MemoryStore.digest()` – Fakten + Keyword-Recall |
| 2 PLAN | Zielzerlegung in verifizierbare Aufgaben | LLM-Aufruf mit striktem JSON-Vertrag |
| 3 EXECUTE | Eine Aufgabe → ein Artefakt, begrenzte Wiederholungen | `ForgeAgent._execute()`, max_retries |
| 4 CRITIQUE | Adversariale Selbstbewertung, Score zwingt Iteration | `ForgeAgent._critique()`, Score ≥ 8 = Konvergenz |

## Sicherheitsmodell (wichtig für ASI-Forschung)

1. **Begrenzte Zyklen** (`max_cycles`) – keine unendliche Selbstverbesserung.
2. **Begrenzte Wiederholungen** (`max_retries`) – kein Ressourcen-Hamsterrad.
3. **Nur-Lese-Ziel** – der Agent schreibt ausschließlich in sein eigenes Datenverzeichnis.
4. **Mensch am Ende** – jeder Lauf endet mit einem Bericht (`CycleReport.summary()`).

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
