# Aktualisiert am 2026-09-14T14:38:18.434281

# Aktualisiert am 2026-09-14T14:35:04.149013

Das Artefakt liest Schwarm-Ergebnisse aus dem Datenverzeichnis, priorisiert sie nach Dringlichkeit und Wirkung und generiert einen umsetzbaren Aktionsplan mit Verantwortlichen und Fristen. Ohne echte Daten wird ein Demo-Plan erstellt, der die Struktur zeigt.

```python
#!/usr/bin/env python3
"""Schwarm-Ergebnisse in Handlungen umsetzen - Deliverable-Generator."""

import sys
import os
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict


def load_swarm_results(data_dir: Path) -> list[dict]:
    """Lade Schwarm-Ergebnisse aus dem Datenverzeichnis."""
    results = []
    # Suche nach JSON- oder CSV-Dateien mit Schwarm-Ergebnissen
    for ext in ("*.json", "*.jsonl", "*.csv"):
        for fpath in data_dir.rglob(ext):
            try:
                if fpath.suffix == ".json":
                    with open(fpath) as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            results.extend(data)
                        elif isinstance(data, dict):
                            results.append(data)
                elif fpath.suffix == ".jsonl":
                    with open(fpath) as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                results.append(json.loads(line))
                elif fpath.suffix == ".csv":
                    with open(fpath) as f:
                        reader = csv.DictReader(f)
                        results.extend(list(reader))
            except Exception:
                continue
    return results


def prioritize_actions(results: list[dict]) -> list[dict]:
    """Priorisiere Aktionen nach Dringlichkeit und Wirkung."""
    prioritized = []
    for item in results:
        # Extrahiere Felder mit Fallbacks
        title = item.get("title", item.get("action", item.get("goal", "Unbenannt")))
        urgency = item.get("urgency", item.get("priority", item.get("dringlichkeit", 3)))
        impact = item.get("impact", item.get("wirkung", item.get("score", 3)))
        owner = item.get("owner", item.get("verantwortlicher", item.get("assignee", "Unzugewiesen")))
        deadline = item.get("deadline", item.get("frist", item.get("due_date", "")))
        category = item.get("category", item.get("kategorie", item.get("bereich", "Allgemein")))

        # Bewerte: hoher Score = dringend + wirksam
        try:
            u = int(urgency)
        except (ValueError, TypeError):
            u = 3
        try:
            i = int(impact)
        except (ValueError, TypeError):
            i = 3

        score = (u * 0.6) + (i * 0.4)
        prioritized.append({
            "title": title,
            "score": round(score, 2),
            "urgency": u,
            "impact": i,
            "owner": owner,
            "deadline": deadline,
            "category": category,
            "source": str(item.get("source", item.get("datei", "unbekannt")))
        })

    # Sortiere nach Score absteigend
    prioritized.sort(key=lambda x: x["score"], reverse=True)
    return prioritized


def generate_roadmap(prioritized: list[dict], weeks: int = 12) -> list[dict]:
    """Erstelle eine phasenbasierte Implementierungs-Roadmap."""
    phases = [
        {"phase": 1, "name": "Analyse & Priorisierung", "weeks": [1, 2],
         "focus": "Schwarm-Ergebnisse analysieren, Schlüsselaktionen identifizieren"},
        {"phase": 2, "name": "Planung & Zuweisung", "weeks": [3, 4],
         "focus": "Konkrete Aktionsitems definieren, Owner zuweisen, Fristen setzen"},
        {"phase": 3, "name": "Umsetzung - Sprint 1", "weeks": [5, 6, 7],
         "focus": "Hochpriorisierte Aktionen implementieren"},
        {"phase": 4, "name": "Umsetzung - Sprint 2", "weeks": [8, 9],
         "focus": "Mittlere Priorität abschließen, erste Ergebnisse evaluieren"},
        {"phase": 5, "name": "Review & Anpassung", "weeks": [10, 11],
         "focus": "Stakeholder-Review, Roadmap anpassen, Lessons Learned"},
        {"phase": 6, "name": "Abschluss & Dokumentation", "weeks": [12],
         "focus": "Finaler Abschluss, Deliverable finalisieren, Fortschritt dokumentieren"},
    ]

    roadmap = []
    for phase in phases:
        phase_items = [
            item for item in prioritized
            if item["score"] >= (10 - phase["phase"] * 1.2)
        ][:4]  # Max 4 Items pro Phase
        roadmap.append({
            **phase,
            "actions": [item["title"] for item in phase_items],
            "owners": list(set(item["owner"] for item in phase_items if item["owner"] != "Unzugewiesen"))
        })
    return roadmap


def generate_deliverable(prioritized: list[dict], roadmap: list[dict],
                         data_dir: Path, output_path: Path) -> str:
    """Generiere den finalen Deliverable-Text."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    lines = []
    lines.append("# Schwarm-Ergebnisse in Handlungen umsetzen")
    lines.append(f"**Generiert am:** {now}")
    lines.append(f"**Datenquelle:** {data_dir}")
    lines.append(f"**Anzahl analysierter Ergebnisse:** {len(prioritized)}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 1. Priorisierte Aktionen")
    lines.append("")
    lines.append("| # | Titel | Score | Dringlichkeit | Wirkung | Owner | Frist | Kategorie |")
    lines.append("|---|-------|-------|---------------|---------|-------|-------|-----------|")
    for idx, item in enumerate(prioritized[:20], 1):
        lines.append(
            f"| {idx} | {item['title']} | {item['score']} | {item['urgency']} | "
            f"{item['impact']} | {item['owner']} | {item['deadline']} | {item['category']} |"
        )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 2. Implementierungs-Roadmap (12 Wochen)")
    lines.append("")
    for phase in roadmap:
        lines.append(f"### Phase {phase['phase']}: {phase['name']} (Wochen {phase['weeks'][0]}-{phase['weeks'][-1]})")
        lines.append(f"**Fokus:** {phase['focus']}")
        if phase["actions"]:
            lines.append("**Aktionen:**")
            for a in phase["actions"]:
                lines.append(f"  - {a}")
        if phase["owners"]:
            lines.append(f"**Verantwortliche:** {', '.join(phase['owners'])}")
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 3. Zusammenfassung")
    lines.append("")
    high_priority = [i for i in prioritized if i["score"] >= 7]
    lines.append(f"- **{len(high_priority)} hochpriorisierte Aktionen** identifiziert")
    lines.append(f"- **{len(prioritized)} Gesamtaktionen** zur Umsetzung bereit")
    lines.append(f"- **6 Phasen** über 12 Wochen geplant")
    lines.append(f"- **Nächster Schritt:** Phase 1 starten - Analyse der Schwarm-Ergebnisse")
    lines.append("")
    lines.append("---")
    lines.append("*Dieses Dokument wurde automatisch aus den Schwarm-Ergebnissen generiert.*")

    text = "\n".join(lines)
    with open(output_path, "w") as f:
        f.write(text)
    return text


def create_demo_plan(output_path: Path) -> str:
    """Erstelle einen Demo-Plan, wenn keine echten Daten vorhanden sind."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    demo_results = [
        {"title": "Schwarmwissen konsolidieren und strukturieren", "urgency": 9, "impact": 8,
         "owner": "Schwarm-Koordinator", "deadline": "2026-09-30", "category": "Wissensmanagement"},
        {"title": "Verfallene Schwarmdaten identifizieren und auffrischen", "urgency": 8, "impact": 7,
         "owner": "Daten-Team", "deadline": "2026-10-07", "category": "Datenpflege"},
        {"title": "Simulationen vor echten Handlungen erhöhen", "urgency": 7, "impact": 9,
         "owner": "Simulations-Team", "deadline": "2026-10-14", "category": "Simulation"},
        {"title": "Stakeholder-Review der priorisierten Ergebnisse", "urgency": 6, "impact": 8,
         "owner": "Projektleitung", "deadline": "2026-10-21", "category": "Governance"},
        {"title": "Implementierung der Top-3-Aktionen", "urgency": 9, "impact": 9,
         "owner": "Ausführungsteam", "deadline": "2026-11-04", "category": "Umsetzung"},
        {"title": "Fortschritts-Tracking-System einrichten", "urgency": 7, "impact": 6,
         "owner": "DevOps", "deadline": "2026-10-28", "category": "Infrastruktur"},
        {"title": "Lessons Learned Dokumentation", "urgency": 5, "impact": 7,
         "owner": "Wissensmanagement", "deadline": "2026-11-11", "category": "Dokumentation"},
    ]

    prioritized = prioritize_actions(demo_results)
    roadmap = generate_roadmap(prioritized)

    lines = []
    lines.append("# Schwarm-Ergebnisse in Handlungen umsetzen")
    lines.append(f"**Generiert am:** {now}")
    lines.append("**HINWEIS:** Keine echten Daten gefunden. Demo-Plan basierend auf typischen Schwarm-Ergebnissen.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 1. Priorisierte Aktionen")
    lines.append("")
    lines.append("| # | Titel | Score | Dringlichkeit | Wirkung | Owner | Frist | Kategorie |")
    lines.append("|---|-------|-------|---------------|---------|-------|-------|-----------|")
    for idx, item in enumerate(prioritized[:20], 1):
        lines.append(
            f"| {idx} | {item['title']} | {item['score']} | {item['urgency']} | "
            f"{item['impact']} | {item['owner']} | {item['deadline']} | {item['category']} |"
        )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 2. Implementierungs-Roadmap (12 Wochen)")
    lines.append("")
    for phase in roadmap:
        lines.append(f"### Phase {phase['phase']}: {phase['name']} (Wochen {phase['weeks'][0]}-{phase['weeks'][-1]})")
        lines.append(f"**Fokus:** {phase['focus']}")
        if phase["actions"]:
            lines.append("**Aktionen:**")
            for a in phase["actions"]:
                lines.append(f"  - {a}")
        if phase["owners"]:
            lines.append(f"**Verantwortliche:** {', '.join(phase['owners'])}")
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 3. Zusammenfassung")
    lines.append("")
    high_priority = [i for i in prioritized if i["score"] >= 7]
    lines.append(f"- **{len(high_priority)} hochpriorisierte Aktionen** identifiziert")
    lines.append(f"- **{len(prioritized)} Gesamtaktionen** zur Umsetzung bereit")
    lines.append(f"- **6 Phasen** über 12 Wochen geplant")
    lines.append(f"- **Nächster Schritt:** Phase 1 starten - Analyse der Schwarm-Ergebnisse")
    lines.append("")
    lines.append("---")
    lines.append("*Dieses Dokument wurde automatisch aus den Schwarm-Ergebnissen generiert.*")

    text = "\n".join(lines)
    with open(output_path, "w") as f:
        f.write(text)
    return text


def main():
    # Datenverzeichnis bestimmen
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(os.environ.get("ZOETRON_DATA", ""))
    output_path = Path("artefakte/schwarm_ergebnisse_in_handlungen.md")

    if not data_dir or not data_dir.exists():
        print(f"[INFO] Kein Datenverzeichnis gefunden. Erstelle Demo-Plan.")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        text = create_demo_plan(output_path)
        print(f"[OK] Deliverable erstellt: {output_path}")
        print(text[:500])
        return

    # Schwarm-Ergebnisse laden
    results = load_swarm_results(data_dir)

    if not results:
        print(f"[INFO] Keine Ergebnisse im Datenverzeichnis gefunden. Erstelle Demo-Plan.")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        text = create_demo_plan(output_path)
        print(f"[OK] Deliverable erstellt: {output_path}")
        print(text[:500])
        return

    print(f"[INFO] {len(results)} Ergebnisse geladen aus {data_dir}")

    # Priorisieren und Roadmap erstellen
    prioritized = prioritize_actions(results)
    roadmap = generate_roadmap(prioritized)

    # Deliverable generieren
    output_path.parent.mkdir(parents=True, exist_ok=True)
    text = generate_deliverable(prioritized, roadmap, data_dir, output_path)

    print(f"[OK] Deliverable erstellt: {output_path}")
    print(f"[INFO] {len(prioritized)} Aktionen priorisiert, {len(roadmap)} Phasen geplant")

    # Zusammenfassung auf stdout
    print("\n--- ZUSAMMENFASSUNG ---")
    for phase in roadmap:
        print(f"Phase {phase['phase']}: {phase['name']} ({len(phase['actions'])} Aktionen)")
    print("--- ENDE ---")


if __name__ == "__main__":
    main()
```

## Review
- Review pending


## Review
- Review pending
