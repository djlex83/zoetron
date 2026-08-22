# 📊 Der Score – Zoetrons Notensystem

Jeder ACT-Lauf endet mit einem **Score von 0–10**, den der **Critic** (ein LLM-Richter im Swarm) vergibt. Er bewertet die Artefakte der Builder gegen das Ziel und nennt konkrete Mängel (`issues`). Bei fehlgeschlagenen Tasks wird der Score auf max. 3 gekappt.

## Skala & Konsequenzen

| Score | Bedeutung | Automatische Folge |
|---|---|---|
| 8–10 | **Konvergiert** – Ziel gut erfüllt | ✅ Issue wird automatisch geschlossen, Label `status:erledigt`, Strategie gilt als gelöst |
| 5–7 | **Brauchbar, aber lückenhaft** | 🧬 Evolution startet: 3 Strategie-Varianten werden gezüchtet, Critic wählt den Sieger → Issue bleibt offen mit `status:evolviert` |
| ≤ 4 | **Mangelhaft** – Ziel nicht erfüllt | 🧬 Evolution läuft ebenfalls; Sieger-Strategie vererbt sich an künftige Pläne |
| 5* | Technischer Fallback: Critic-Antwort unparsebar | wie „brauchbar" – wird als Mangel vermerkt |
| ≤ 3* | Erzwungen bei gescheiterten Tasks | harte Kappe, unabhängig vom LLM-Urteil |

\* = code-seitige Regeln, keine Meinungs-Skala

## Wie der Critic bewertet

- **Eingabe:** Ziel + alle Builder-Artefakte (bis 6000 Zeichen pro Task)
- **Ausgabe:** striktes JSON `{score: 0–10, issues: [...]}`
- **Temperature 0.0** – nüchtern, keine Kreativ-Bonusse
- **Selbstkalibrierung:** METACOG vergleicht vorhergesagten vs. echten Score (lernt Zoetrons eigene Überschätzung kennen)
- **Protokoll:** Jede Wertung landet als `last_swarm_critique` + `model_score` im Gedächtnis

## Die Score-Geschichte von Zoetron

| Lauf | Ziel | Score |
|---|---|---|
| #1 | 26-Fakten-Wissensbasis revalidieren | 3 |
| #2 | Cross-dream patterns extrahieren | 3 |
| #3 | Session-state-to-closure gap schließen | 6 |
| … | *(wächst mit jedem Herzschlag)* | |

**Beobachtung:** Noch kein Lauf hat 8+ erreicht – Zoetron ist ein fleißiger Schüler, aber die Konvergenzschwelle ist bewusst hoch gelegt. Jede Nicht-Konvergenz füttert die Evolution.

---
*Quelle der Wahrheit: `src/zoetron/swarm.py` (`_critic_review`) · Stand: 2026-08-22*
