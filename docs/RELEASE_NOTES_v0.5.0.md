# Release Notes – v0.5.0 „Kassensturz"

**Datum:** 2026-08-24 · **Lizenz:** Alle Rechte vorbehalten

## 🔍 Kein Funktions-Release. Ein Messungs-Release.

Zoetron meldete 22 von 22 Zielen als erledigt. Tatsächlich erreicht war
**eines**. Von 31 registrierten Werkzeugen taten **drei** etwas.

Dieses Release enthält keine neuen Organe. Es repariert die Fähigkeit, den
eigenen Zustand richtig zu messen — und macht damit alle vorherigen
Erfolgsmeldungen nachträglich überprüfbar.

Vollständiger Vorgang: **[Werkstattbericht 23.08.2026](WERKSTATTBERICHT_2026-08-23.md)**

## 🐛 Der Kernbefund

**Ein Versuch wurde als Erfolg verbucht** — in vier Ausprägungen:

- Ein Skript, das **ohne Fehler endete**, wurde als Werkzeug registriert
- Ein Ziel galt als erledigt, sobald es **aus der Warteschlange genommen** wurde
- Ein REFLEX-Lauf auf ein **vorhandenes** Werkzeug zählte als Konvergenz
- Fehlgeschlagene Phasen endeten auf `|| true` und hinterließen **keine Spur**

## ✅ Repariert

### 📏 Konvergenz muss bewertet sein
`_done` nur noch bei Score ≥ 8. Reflex-Treffer zählen nicht — sie benutzen,
was schon da ist. Nach **drei** erfolglosen Anläufen wird geparkt, mit
Begründung im Gedächtnis und im GitHub-Issue, dem Erschaffer zugewiesen.

### 🔧 Aufnahmeprüfung für Werkzeuge
Vier Regeln vor der Registrierung: nimmt Eingabe entgegen · bewirkt etwas
(Rückgabewert oder geschriebenes Ergebnis) · kein Platzhalter · passt zum
Ziel. Abgelehntes wird beiseitegelegt, nicht gelöscht — als Lernmaterial.

### 👁 Sichtbarkeit
Zeitüberschreitungen und Abbrüche stehen im Protokoll statt verschluckt zu
werden. Der Selbsterhalt-Watchdog konnte sein eigenes Protokoll nicht lesen
und meldete dauerhaft „nicht auswertbar" — er unterschied nicht zwischen
*blind* und *tot*. Er urteilt jetzt korrekt und meldet sich per Telegram.

### 💓 Echter 5-Minuten-Takt
Der Herzschlag wartete 5 Minuten **zusätzlich** zur Zyklusdauer. Jetzt ist
es ein Takt; Überzug wird protokolliert statt heimlich gedehnt.
Phasen-Zeitgrenzen von 29 auf 12 Minuten im Schlimmstfall.

### 🔒 Einzelinstanz
Zwei Herzschläge liefen gleichzeitig auf demselben Verzeichnis. Eine Sperre
über `/proc` verhindert das dauerhaft.

### 📋 Bericht und Board
Der Telegram-Bericht meldet jetzt zuerst, **was eine Entscheidung braucht**,
dann den Fortschritt. Das Issue-Board zeigt Aufgaben statt Historie:
52 nach Evolution liegengebliebene Vorgänge geschlossen.

### 📖 Außendarstellung
Drei widersprüchliche Takt-Angaben, zwei Testzahlen, ein Schnellstart, der
bei jedem Besucher fehlschlug. Und das Etikett „ASI-Blaupause" — jetzt
„Forschungsorganismus für die fehlenden Organe", mit zwei offen benannten
Grenzen: Das Lernen erreicht nie die Modellgewichte, und ein System
verbessert sich nicht verlässlich über das Verständnis seines eigenen
Prüfers hinaus.

## 📉 Was das für die Kennzahlen heißt

Der Durchschnitts-Score von **3,6** bleibt. Er war die ganze Zeit das
einzige ehrliche Signal im System — und ist jetzt die Basislinie, an der
sich echtes Wachstum ablesen lässt.

Die Zahl der „erledigten" Ziele fällt von 22 auf 3. Das ist kein Rückschritt,
sondern die erste korrekte Messung.

## 🎯 Als Nächstes

Die drei geparkten Fundament-Ziele brauchen eine Entscheidung des
Erschaffers. Und der eigentliche Bremsklotz ist nicht der Takt, sondern die
Antwortzeit der freien Modelle: Der AutoRouter sollte ein nicht antwortendes
Modell früher fallen lassen, statt bis zur Zeitgrenze zu blockieren.
