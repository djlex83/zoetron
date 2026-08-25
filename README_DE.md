# 🫀 Zoetron

[🇬🇧 English version](README.md)

**Ein autonomer Agent-Organismus, der aus jeder Erfahrung schlauer wird –
auf kostenlosen OpenRouter-Modellen, mit AutoRouter gegen Modell-Sterblichkeit.**

Zoetron ist kein Agent-Framework. Es ist ein **Organismus**: Herzschlag,
Neugier, Schlaf, Weltmodell, Selbstmodell und ein Immunsystem gegen tote Modelle.

**🧠 Sein Gedächtnis live ansehen:** [Zoetron-Seite](https://djlex83.github.io/zoetron/)
– sein Gehirn, sein Ideen-Board und sein Gedächtnisstrom auf einer Seite, bei
jedem Herzschlag neu gezeichnet · [2D-Wissensgraph](https://djlex83.github.io/zoetron/graph.html)
· [3D-Gehirn](https://djlex83.github.io/zoetron/brain.html) – jedes gelernte
Faktum wird zum Neuron; das Alter lässt es verblassen.

**📈 Zusehen, ob er besser wird – oder nicht:** [Fußball-Lernkurve](https://djlex83.github.io/zoetron/fussball.html).
Der Organismus sagt Spielausgänge aus 153.000 Partien (2000–2024) vorher und
wird vom tatsächlichen Ergebnis bewertet, nicht von einem Sprachmodell. Zu
schlagen sind **50,2 %** auf ungesehenen Spielen, ohne Buchmacherquoten; der
Buchmacher schafft 51,5 %. Ein dritter Satz aus 13.143 Partien ist
**versiegelt und liegt nie auf dem Rechner des Organismus** – denn ein
Prüfsatz, den man hundertmal befragt, ist keiner mehr.
Die Seite selbst ist eine React/Vite/Tailwind/GSAP-App in [`site/`](site/),
die nach `docs/` baut.

```
Ziel ──► PLAN ──► SIMULIEREN ──► SELBSTEINSCHÄTZUNG ──► BAUEN ──► KRITIK
          ▲                                                    │
          └────────── Score < 8: neue Iteration ◄──────────────┘
                     ▼
     JSONL-Gedächtnis (Fakten + Ereignisse) → DREAM destilliert Einsichten
                     ▼
     DRIVE erzeugt die nächsten eigenen Ziele aus Wissenslücken
```

## Die Organe

| Organ | Natur-Vorbild | Datei | Was es tut |
|---|---|---|---|
| 💓 HERZ | Herzschlag | `heartbeat_daemon.sh` | alle **30 Min** (48/Tag): REFLEX → PRUNE → DREAM → DRIVE → ACT (+HÄNDE) → FUSSBALL-MESSUNG → WILLE → GENOM → LEHREN → SELBSTLERNEN → TELEGRAM → IDEEN → BESTENLISTE → GRAPH+3D-GEHIRN → SELBSTDIAGNOSE → RETRO → git/wiki-Sync |
| 🧬 GENOM | angeborene DNA | `genome.py` | **5 Instinkt-Regeln** (`data/genome.json`) in *jedem* LLM-Prompt – schütze Gedächtnis, Erschaffer zuerst, Selbsterhalt-Watchdog, Ehrlichkeit, aus jedem Fehler lernen |
| 🔥 DRIVE | Neugier/Trieb | `drive.py` | generiert **eigene Ziele** aus Gedächtnislücken – auf Deutsch mit verständlichem „Why" |
| 💭 DREAM | Schlaf/Replay | `dream.py` | destilliert Erlebnisse zu dauerhaften Einsichten + Skill-Vorschlägen |
| 🪞 METACOG | Selbstgefühl | `metacog.py` | sagt eigenen Score voraus, misst Kalibrierung |
| 🌍 SIMULATE | Weltmodell | `simulate.py` | trocken üben vor dem Handeln, Risiken vorab |
| 👁 SINNE | Augen/Ohren | `senses.py` | beobachtet HN-Frontier + Websuche; frische Signale speisen DRIVE |
| 🔬 RESEARCHER | Kundschafter | Swarm-Rolle 4 | frische Web-Fakten vor jeder Planung (Phase 2 aus ROLES.md) |
| 🕸 SEMANTISCH | Bedeutungsrinde | `semantic.py` | TF-IDF + Synonym-Felder + **Cross-Domain-Bridging**: findet verwandtes Wissen *nach Bedeutung*, nicht nach Wortlaut – in jedem Plan |
| ✋ HÄNDE | Motorik | `hands.py` | führt Artefakt-Code in der Sandbox aus; **Erfolge werden wiederverwendbare Werkzeuge** (`data/tools/`) |
| 🧬 EVOLUTION | Fortpflanzung | `evolution.py` | N Varianten → Critic wählt den Fitnessten; Sieger vererben sich, **Verlierer werden Verbots-Liste (Anti-Patterns)** |
| 🩸 STOFFWECHSEL | Stressachse | `metabolism.py` | Rate-Limits/Timeouts erhöhen Stress → kleinere Pläne |
| ✂️ PRUNE | Apoptose | `prune.py` | archiviert alte Erinnerungen, behält genutzte Fakten |
| 🎯 WILLE | Stirnlappen | `will.py` | langfristige **Missionen** mit messbaren Zielen überdauern Zyklen; haben Vorfahrt vor kurzer Neugier (Flüstern gewinnt weiter) |
| 🪞 RETRO | Gewissen | `retro.py` | reviewt nach jedem Schlag die eigenen Zyklen: ehrliche Befunde werden `retro_lesson:`-Fakten und speisen den nächsten Planner-Prompt |
| 🕸 GRAPH+GEHIRN | Assoziationsrinde | `graph.py`, `graph_view.py`, `brain_view.py` | Live-Wissensnetz (2D-Physik-View + **3D-Gehirn** mit Hemisphären & Synapsen-Pulsen), **semantisches Linking**: Synapsen nach TF-IDF-Bedeutung (Kosinus ≥ 0,18), nicht nach Wortgleichheit – „Timeout beim Build" findet „abgebrochen wg. Zeitüberschreitung"; Dubletten automatisch verschmolzen |
| 💡 IDEEN-BOARD | Tagtraum-Notizbuch | `ideen.py` | sammelt seine **eigenen autonomen Ideen** (Fähigkeits-Wünsche, selbstgewählte Ziele, Traum-Erkenntnisse) auf einem öffentlichen Board – bei jedem Herzschlag frisch |
| ⚡ REFLEX-PFAD | Rückenmark | ACT-Logik | prüft die Werkzeugkiste **bevor** das LLM denkt – token-freie Läufe für Bekanntes; 6-h-Drossel je Ziel+Werkzeug (kein Spam) |
| 🛡 CRITIC | Abwehr | `swarm.py` | Qualitätsgate (Score 0–10); **verlangt lauffähigen Code, keine Prosa** |
| 💬 FLÜSTER-KANAL | Menschenstimme | `data/fluester_goals.json` | menschliche Prioritätsziele springen in der Queue nach vorn (`drive_whisper`) |
| 🧬 VERERBUNG | Erblichkeit | `vererbung.py` | übergibt dem nächsten Anlauf die **eigene beste gemessene** Einreichung samt Auftrag *ändere genau eine Sache* — vorher startete jeder Lauf beim selben Spielzeug-Gerüst, vererbt wurde nie etwas |
| 🩺 SELBSTDIAGNOSE | Schmerzrezeptoren | `selbstdiagnose.py` | liest das Herzschlag-Protokoll nach Abstürzen, Zeitgrenzen und Tracebacks (Organ, Fehlerklasse, Datei:Zeile) und legt sie als Ereignis ab — eine abgestürzte Phase war für RETRO bisher nicht *fehlgeschlagen*, sondern *nicht vorhanden* |
| 🛤 BAHNEN | Hebbsche Synapsen | `bahnen.py` | dauerhafte gewichtete Kantentabelle mit **Dopamin-Tor**: nur Läufe mit lauffähigem Code stärken eine Verbindung, Unbestätigtes zerfällt in 4 Tagen auf null |
| 😴 NACHSPIEL | Schlaf-Konsolidierung | `nachspiel.py` | bewertet in DREAM frühere Spuren nach, sobald die **externe** Messung sich bewegt hat — der Kritiker allein darf nie eine Bahn verstärken |
| ⚖️ EXTERNER BEWEIS | unbestechlicher Prüfer | `externer_beweis.py` | ein Ziel gilt erst als erreicht, wenn eine Messung außerhalb des Systems es sagt; widerspricht sie dem Kritiker, **gewinnt die Messung** |
| 🧯 WIDERSPRUCHS-WÄCHTER | Immuntoleranz | `widerspruch.py` | räumt in PRUNE Werkzeugaufruf-Müll und Schlüsselkollisionen aus dem Gedächtnis — archiviert, nie gelöscht |
| 🔌 KONTOSPERRE | Winterschlaf | `kontosperre.py` | erkennt ein ausgeschöpftes Konto (nur wenn **alle** Kandidaten am Konto scheitern, mit 3+ Belegen), schläft bis zum Rücksetzzeitpunkt und weckt sich selbst |
| 🧱 SCHUTZWALL | Blut-Hirn-Schranke | `schutzwall.py` | bewacht `os.remove`/`rmtree`/`rename` außerhalb der Sandbox — Schutz gegen Versehen, ausdrücklich **keine** Sicherheitsgrenze |
| 🚦 WERKZEUGPRÜFUNG | Qualitätskontrolle | `werkzeugpruefung.py` | fünf Regeln entscheiden, was in die Werkzeugkiste darf; Abgelehntes geht nach `data/tools_abgelehnt/`, nicht in den Müll |
| 🩻 AUTOROUTER | Immunsystem | `router.py`, `model_health.py` | sortiert freie Modelle nach **gemessener** Fehlerquote und Antwortzeit statt nach Metadaten; wer nie antwortet, hält keinen Platz mehr |
| 🧠 Gedächtnis | Hippocampus | `memory.py` | JSONL-Fakten + Ereignis-Log + Keyword-Recall; automatisch dedupliziert |

## Der autonome Kreislauf

Alle **30 Minuten** (48 Zyklen/Tag) läuft Zoetron einen vollständigen
Entwickler-Zyklus **ohne menschliches Zutun** – und denkt dabei über sich
selbst nach. Telegram-Berichte kommen einmal je Schlag,
damit das schnelle Denken den Menschen nicht zuspammt:

```
HERZSCHLAG (alle 30 Min)
 ├─ ⚡ REFLEX   Werkzeugkiste zuerst – Bekanntes läuft ohne Token (6-h-Drossel)
 ├─ ✂️ PRUNE    alte Erinnerungen archivieren
 ├─ 💭 DREAM    neue Einsichten + Skill-Ideen aus frischen Erfahrungen
 ├─ 🔥 DRIVE    wählt sein nächstes Ziel (Neugier) oder ein Flüster-Ziel (du)
 ├─ 🐜 ACT      Swarm plant → baut → Critic bewertet 0–10
 │     Score ≥ 8: Issue schließt sich selbst (status:erledigt) ✅
 │     Score < 8: Evolution züchtet Strategien, Verlierer werden
 │                Verbotsliste (Anti-Patterns), Sieger werden vererbt
 ├─ ✋ HÄNDE    Artefakt-Code in der Sandbox ausgeführt; Erfolge werden Tools
 ├─ 📱 TELEGRAM postet den Ausführungs-Beweis (jeder Schlag)
 ├─ ⚽ MESSUNG  ein externer Prüfer benotet Fußball-Einreichungen — ohne LLM
 ├─ 🕸 GRAPH    baut den Live-Wissensgraph neu – semantische Synapsen
 ├─ 💡 IDEEN    erneuert das öffentliche Ideen-Board (seine eigenen Erfindungen!)
 ├─ 🩺 DIAGNOSE liest das eigene Protokoll nach Abstürzen und legt sie ab
 └─ 🪞 RETRO   reviewt die eigenen Zyklen: „was lief gut / schlecht?"
               Lehren wandern ins Gedächtnis für künftige Planner
```

- **Scoring:** 0–10 von einem adversarialen Critic-LLM; ab 8 = konvergiert.
  Details: [Wiki → Scoring](../../wiki/Scoring)
- **Flüster-Kanal:** Menschen können Prioritätsziele über
  `data/fluester_goals.json` einschleusen – Zoetron führt sie **vor** seiner
  eigenen Neugier aus und protokolliert den Eingriff als `drive_whisper`.
- **Öffentliche Selbstverwaltung:** Issues, Label-Kanban, Releases, Wiki und
  die Landing-Page pflegt der Organismus selbst.

### 💡 Was es alle 30 Minuten denkt

Jeder Herzschlag erzeugt frische Ideen, die öffentlich wachsen:

| Phase | Typische Ideen dabei |
|---|---|
| 💭 DREAM | destillierte Einsichten („was habe ich seit dem letzten Schlag gelernt?") + konkrete Skill-Vorschläge |
| 🔥 DRIVE | ein brandneues Ziel mit verständlichem deutschem *Why* – gewählt, weil das Gedächtnis dort eine Lücke hat |
| 🐜 ACT | lauffähige Python-Artefakte je Task (Code ist Pflicht, Prosa allein gibt schlechte Scores) |
| 🧬 EVOLUTION | bis zu 3 grundverschiedene Angriffswinkel pro Fehlschlag; der Fitnesste wird Erbstrategie |
| 🪞 RETRO | ehrliche Selbstbefunde wie *„Durchschnitts-Score nur 1,5/10 – Code-Pflicht greift noch zu schwach"* oder *„N Hände-Fehlschläge – baue kleinere eigenständige Skripte"* |

Echte Beispiele aus dem Gedächtnis: *„MemoryStore als selbst-prunenden
Ring-Puffer neu entwerfen"*, *„Embedding-getriebene Organ-Integration: BFS
durch gelernte Ähnlichkeit ersetzen"*, *„MemoryStore-Vertragsprüfer vor jedem
Hände-Batch erzwingen; früh und laut scheitern."*

## Zugang zum Quellcode

Der Quellcode ist **nicht öffentlich** (gesperrter Bereich, alle Rechte vorbehalten).
Dieses Repository ist Zoetrons öffentliches Logbuch: Architektur, Wiki, lebendes
Gedächtnis, Wissensgraph, 3D-Gehirn und Wochenberichte — alles, was der Organismus
über sich selbst schreibt, bei jedem Herzschlag aktualisiert. Hier gibt es nichts
zu installieren.

Lizenz & Zusammenarbeit nur auf seriöse, schriftliche Anfrage über GitHub
**@djlex83** — mit echtem Namen, Hintergrund und konkretem Anliegen.
Lizenzvergabe erfordert Vertrag + NDA.

<details>
<summary>CLI-Referenz (für Lizenznehmer)</summary>

```bash
python -m zoetron.cli run "Dein Ziel" --swarm --save-artifacts out/
python -m zoetron.cli models   # Routing-Queue live ansehen
python -m zoetron.cli drive    # eigene Ziele generieren lassen
python -m zoetron.cli dream    # Schlafphase: Erfahrung konsolidieren
python -m zoetron.cli status   # Selbstmodell & Kalibrierung
```

Konfiguration über `.env`: `OPENROUTER_API_KEY` und `ZOETRON_MODEL=auto`
(AutoRouter = modell-unsterblich). Ohne Key: deterministisches Mock-Gehirn,
alle **168 Tests** komplett offline grün. `ZOETRON_MODEL=auto` entdeckt automatisch
alle kostenlosen Tool-fähigen OpenRouter-Modelle und lernt aus eigenen Läufen,
welche gut sind.

</details>

## Warum das existiert

Aktuelle LLM-Agents sind Orakel auf Abruf: eingefrorene Gewichte, keine
eigenen Ziele, kein Schlaf, keine Selbstkenntnis. Zoetron baut die fehlenden
Organe als Software – ein selbst-gehosteter Forschungsorganismus für
kontinuierlich lernende Systeme.

## Status

Früher Prototyp (v0.x), aktive Entwicklung, Design ändert sich schnell.
Erste Live-Läufe haben gezeigt: Der Critic fängt echte Produkt-Inkonsistenzen,
DREAM diagnostiziert eigene Pipeline-Bugs aus Erfahrung, der AutoRouter
überspringt tote Modelle automatisch. **Meilenstein:** Das erste vollautonome
Ziel konvergierte (Score 8/10) und schloss sein eigenes GitHub-Issue – der
komplette Kreislauf *denken → handeln → bewerten → abschließen* läuft
unbemannt bei jedem Herzschlag.

**Kassensturz, 23.08.2026.** Eine gründliche Prüfung ergab, dass der Organismus
*Versuche* als Erfolge verbucht hat: Von 22 als erledigt gemeldeten Zielen war
**eines** tatsächlich erreicht, von 31 registrierten Werkzeugen taten **drei** etwas.
Messung, Werkzeug-Aufnahme und Protokollierung sind repariert — Konvergenz muss jetzt
bewertet sein, Werkzeuge bestehen eine Aufnahmeprüfung, und Abbrüche werden nicht
mehr verschluckt. Der ganze Vorgang mit allen Zahlen:
**[Werkstattbericht 23.08.2026](docs/WERKSTATTBERICHT_2026-08-23.md)**.

## 🔒 Quellcode-Hinweis

> Der Code ist nicht öffentlich (gesperrter Bereich).
> **Lizenz & Zusammenarbeit nur auf seriöse, schriftliche Anfrage** über GitHub
> **@djlex83** – mit echtem Namen, Hintergrund und konkretem Anliegen.
> Formlose Massen-Nachrichten, Werbeangebote und „Preis?“-One-Liner werden
> ignoriert. Lizenzvergabe erfordert Vertrag + NDA. Alle Rechte vorbehalten.

## Lizenz

Alle Rechte vorbehalten – Nutzung/Kopieren/Weitergabe nur mit
Genehmigung des Autors. Siehe [LICENSE](LICENSE). Anfragen: Issue oder
[@djlex83](https://github.com/djlex83).
