# Release Notes – v0.3.0 „Autonomie"

**Datum:** 2026-08-22 · **Tests:** 65/65 ✅ · **Lizenz:** Alle Rechte vorbehalten

## 🏆 Meilenstein

Der erste **vollautonome Ziel-Zyklus konvergierte** (Score 8/10) und schloss
sein eigenes GitHub-Issue (#8). Der komplette Kreislauf
*denken → handeln → bewerten → abschließen* läuft jetzt unbemannt bei jedem
Herzschlag.

## ✨ Neu

- **Autonomer Entwickler-Kreislauf:** DRIVE-Ziele werden automatisch als
  GitHub-Issues angelegt (`status:in-arbeit`), vom Swarm bearbeitet, vom
  Critic bewertet (0–10) und bei Konvergenz selbst geschlossen
  (`status:erledigt`). Label-Kanban: idee / in-arbeit / evolviert / erledigt.
- **Flüster-Kanal:** Menschliche Prioritätsziele über
  `data/fluester_goals.json` – Zoetron führt sie vor seiner eigenen Neugier
  aus, Eingriffe werden als `drive_whisper` protokolliert.
- **Deutsche Nutzer-Sprache:** Alle sichtbaren Ausgaben (Ziele inkl. „why",
  Telegram-Berichte, Gedächtnis-Ansicht) auf einfachem Deutsch; LLM-Prompts
  bleiben englisch. Fallback-Ziele inklusive.
- **Scoring-Dokumentation:** Wiki-Seite `Scoring.md` (Skala, Critic-Regeln,
  Score-Historie).
- **PR-Workflow:** Erster selbst eröffneter und gemergter Pull Request (#3).

## 🛠 Behoben

- Issue-Erstellung im ACT: Pfad-Bug + stiller `except: pass` → Fehler sind
  jetzt als `gh_issue_error`-Ereignisse sichtbar.
- Token-Parser liest beide Credential-Formate (`password=` und URL-Format)
  in jeder HOME-Umgebung – Hintergrund-Läufe brechen nicht mehr ab.

## 📚 Dokumentation

- README (EN/DE): Autonomer Kreislauf, Flüster-Kanal, Scoring, Meilenstein.
- Wiki: `Scoring.md` neu, `Home.md` verlinkt.

## ⚖️ Lizenzwechsel

Ab v0.3.0 gilt **„Alle Rechte vorbehalten"**: Nutzung, Kopieren,
Weitergabe und Veränderung nur mit ausdrücklicher Genehmigung des Autors
(@djlex83). Das vorherige Release v0.2.0 wurde unter MIT veröffentlicht und
bleibt davon unberührt.

## 📦 Basis

23 Commits seit v0.2.0 · Python ≥ 3.10 · OpenRouter (AutoRouter, nur freie
Modelle mit Tool-Support) · Offline-Mock-Modus ohne API-Key.
