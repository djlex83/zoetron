# Werkstattbericht, 23. August 2026

*Ein Tag, an dem wir nicht gebaut, sondern nachgesehen haben.*

Zoetron meldete an diesem Tag: 22 von 22 Zielen des aktuellen Plans erledigt.
Tatsächlich erreicht war **eines**.

Dieser Bericht steht hier, weil das Projekt Ehrlichkeit als Grundregel im Genom
trägt (`be_honest`) und weil ein Organismus, der nur seine Erfolge zeigt, genau
das Problem hätte, das wir gefunden haben.

## Der Kernbefund

**Ein Versuch wurde als Erfolg verbucht.** In vier verschiedenen Ausprägungen:

- Ein Skript, das **ohne Fehler endete**, wurde als wiederverwendbares Werkzeug
  registriert — unabhängig davon, ob es etwas tat.
- Ein Ziel galt als **erledigt, sobald es aus der Warteschlange genommen** wurde —
  nicht, wenn es erreicht war.
- Ein REFLEX-Lauf, der ein **vorhandenes** Werkzeug aufrief, zählte als Konvergenz —
  obwohl er per Definition nichts Neues gebaut haben kann.
- Fehlgeschlagene Phasen endeten auf `|| true` und hinterließen **keine Spur** im
  Protokoll.

Deshalb sahen die Wochenberichte gut aus, während wenig entstand. Der
Durchschnitts-Score von 3,6 war die ganze Zeit das einzige ehrliche Signal im
System — und wurde als Schwäche gelesen statt als Messfehler-Anzeige.

## Die Zahlen

| | |
|---|---|
| Ziele als erledigt gemeldet | 22 |
| Tatsächlich erreicht (bewertet, Score ≥ 8) | **1** |
| Nie auch nur versucht | 11 |
| Werkzeuge in der Kiste | 31 |
| davon mit echter Funktion | **3** |
| Dauer, die die Bauphase unbemerkt ausgefallen war | ~1,5 Stunden |
| Parallel laufende Herzschlag-Prozesse | 2 |
| Verwaiste Zombie-Prozesse | 695 |

Drei Beispiele aus der Werkzeugkiste, alle mit Erfolgsquote 1,0 in der eigenen
Statistik:

- ein Skript, das mit zwei fest verdrahteten Zahlen rechnet und das Ergebnis ausgibt
- eines, das fünf Wörter aus einer festen Liste auswürfelt
- ein **Anomalie-Detektor**, abgelegt unter dem Namen „Neue Fähigkeiten aus
  Vorschlägen bauen" — weil der Dateiname aus dem Zieltitel stammt, der Inhalt vom
  Sprachmodell, und niemand beides verglich

## Was repariert wurde

**Messung.** Ein Ziel gilt nur noch als erreicht, wenn ein bewerteter Lauf mit
Score ≥ 8 konvergiert ist. Ein Reflex-Treffer zählt nicht. Nach drei erfolglosen
Anläufen wird geparkt — mit Begründung im Gedächtnis, statt still übersprungen.

**Aufnahmeprüfung für Werkzeuge.** Vier Regeln: nimmt Eingabe entgegen · bewirkt
etwas (Rückgabewert oder geschriebenes Ergebnis) · kein Platzhalter · passt inhaltlich
zum Ziel. Abgelehntes wird nicht gelöscht, sondern beiseitegelegt — als Lernmaterial
und als Testkorpus. Gegen den Bestand geprüft: die echten Werkzeuge bestehen, die
Attrappen fallen durch.

**Sichtbarkeit.** Abbrüche und Zeitüberschreitungen stehen jetzt im Protokoll statt
verschluckt zu werden. Der Selbsterhalt-Watchdog konnte sein eigenes Protokoll nicht
lesen und meldete deshalb dauerhaft „nicht auswertbar" — er unterschied nicht zwischen
*blind* und *tot*. Er urteilt jetzt korrekt und meldet sich.

**Takt.** Der Herzschlag wartete 5 Minuten *zusätzlich* zur Zyklusdauer. Jetzt ist es
ein echter 5-Minuten-Takt; dauert ein Zyklus länger, wird der Verzug protokolliert
statt heimlich gedehnt.

**Einzelinstanz.** Zwei Herzschläge liefen gleichzeitig auf demselben Verzeichnis —
verschränkte Protokolle, halbe Zyklen, doppelt geleerte Warteschlange. Eine Sperre
verhindert das dauerhaft.

**Außendarstellung.** Drei widersprüchliche Angaben zum Takt, zwei zur Testanzahl, ein
Schnellstart, der bei jedem Besucher fehlschlug. Und das Etikett „ASI-Blaupause", das
größer war als die Sache — jetzt „Forschungsorganismus für die fehlenden Organe", mit
zwei offen benannten Grenzen: Das Lernen erreicht nie die Modellgewichte, und ein
System verbessert sich nicht verlässlich über das Verständnis seines eigenen Prüfers
hinaus.

## Was offen bleibt

Der eigentliche Bremsklotz ist nicht der Takt, sondern die Antwortzeit der freien
Modelle: Ein nicht antwortendes Modell blockiert bis zur Zeitüberschreitung. Der
AutoRouter sollte früher weiterrouten.

Der Durchschnitts-Score von 3,6 bleibt. Er ist jetzt ehrlich gemessen — und damit
zum ersten Mal eine Zahl, an der sich Verbesserung ablesen lässt.

## Was wir daraus mitnehmen

Ein System, das Versuche als Erfolge verbucht, **meldet Fortschritt und macht keinen**.
Der Schaden liegt nicht in den falschen Zahlen, sondern darin, dass sie jede
Rückkopplung unbrauchbar machen: Wenn alles gelingt, gibt es nichts zu lernen.

Der zweite Befund ist unspektakulärer und vermutlich häufiger: Dieselbe Logik lag an
mehreren Stellen doppelt im Code. Wer eine Kopie reparierte, hatte das Problem nicht
behoben — und merkte es nicht, weil alles weiter Erfolg meldete.

---

## English summary

On 23 August 2026 the organism reported 22 of 22 planned goals as done. **One** had
actually been achieved.

The root cause was a single pattern in four disguises: **an attempt was recorded as a
success.** A script that exited without error became a registered tool regardless of
what it did. A goal counted as done the moment it was *taken* from the queue, not when
it was reached. A reflex run using an *existing* tool counted as convergence. And
failing phases ended in `|| true`, leaving no trace.

Of 31 tools in the toolbox, 3 did anything useful. The build phase had been dead for
about 90 minutes without anyone noticing. Two heartbeat processes were running in
parallel. The self-preservation watchdog could not parse its own log and had been
reporting "unreadable" instead of a verdict — unable to distinguish *blind* from *dead*.

All of the above is fixed: convergence is now required and scored, tools must pass a
four-rule admission check, aborts and timeouts are logged, the beat is a real
five-minute cadence, and only one instance can run.

The average swarm score of 3.6 remains. It was the only honest signal in the system all
along — and is now the baseline against which real growth can be measured.
