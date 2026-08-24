export type Lang = 'de' | 'en'
export type L = { de: string; en: string }
export const t = (v: L, l: Lang) => v[l]

export const nav: { id: string; label: L }[] = [
  { id: 'takt', label: { de: 'Takt', en: 'Cadence' } },
  { id: 'organe', label: { de: 'Organe', en: 'Organs' } },
  { id: 'gehirn', label: { de: 'Gehirn', en: 'Brain' } },
  { id: 'gedaechtnis', label: { de: 'Gedächtnis', en: 'Memory' } },
  { id: 'lernkurve', label: { de: 'Lernkurve', en: 'Learning' } },
  { id: 'pruefung', label: { de: 'Prüfung', en: 'Check' } },
  { id: 'ideen', label: { de: 'Ideen', en: 'Ideas' } },
  { id: 'wiki', label: { de: 'Wiki', en: 'Wiki' } },
  { id: 'zugang', label: { de: 'Zugang', en: 'Access' } },
]

export const hero = {
  eyebrow: { de: 'Autonomer Agenten-Organismus · v0.4 „Selbstreflexion“', en: 'Autonomous agent organism · v0.4 “Self-reflection”' },
  title1: { de: 'Kein Framework.', en: 'Not a framework.' },
  title2: { de: 'Ein Organismus.', en: 'An organism.' },
  sub: {
    de: 'Zoetron hat einen Herzschlag alle 5 Minuten, sucht sich seine Ziele selbst, träumt seine Erfahrungen zu Einsichten und baut ein Gedächtnis, das Bedeutung versteht. Was du im Hintergrund siehst, ist sein echtes Gehirn — live, nicht animiert.',
    en: 'Zoetron beats every 5 minutes, picks its own goals, dreams experience into insight and grows a memory that understands meaning. What you see behind this text is its real brain — live, not an animation.',
  },
  ctaBrain: { de: '3D-Gehirn öffnen', en: 'Open the 3D brain' },
  ctaCadence: { de: 'Wie es tickt', en: 'How it ticks' },
  scroll: { de: 'scrollen', en: 'scroll' },
  liveNote: { de: 'Live-Gehirn aus docs/brain.html — bei jedem Herzschlag neu geschrieben', en: 'Live brain from docs/brain.html — rewritten on every heartbeat' },
}

export const vitals: { key: string; label: L; hint: L }[] = [
  { key: 'facts', label: { de: 'Fakten', en: 'Facts' }, hint: { de: 'im Langzeitgedächtnis, dedupliziert', en: 'in long-term memory, deduplicated' } },
  { key: 'score', label: { de: 'Ø Critic-Score', en: 'Avg critic score' }, hint: { de: 'strenger Gegen-Gutachter, 0–10', en: 'adversarial judge, 0–10' } },
  { key: 'tools', label: { de: 'Werkzeuge', en: 'Tools' }, hint: { de: 'selbst gebaut, wiederverwendbar', en: 'self-built, reusable' } },
]

/** The 5-minute organ cycle — the spine of the timeline section. */
export const phases: { icon: string; name: string; head: L; body: L }[] = [
  { icon: '⚡', name: 'REFLEX', head: { de: 'Rückenmark', en: 'Spinal cord' }, body: { de: 'Prüft die Werkzeugkiste, bevor überhaupt ein Modell denkt. Bekannte Arbeit läuft ohne einen einzigen Token — 6-Stunden-Drossel pro Ziel-Werkzeug-Paar verhindert Wiederholungsspam.', en: 'Checks the toolbelt before any model thinks. Known work runs without a single token — a 6-hour throttle per goal+tool pair prevents repetition spam.' } },
  { icon: '✂️', name: 'PRUNE', head: { de: 'Apoptose', en: 'Apoptosis' }, body: { de: 'Archiviert Verblasstes. Abgerufene Fakten bleiben, Einsichten sind unsterblich. Gelöscht wird nichts — das erste Instinkt-Gesetz verbietet es.', en: 'Archives what faded. Recalled facts stay, insights are immortal. Nothing is deleted — the first instinct rule forbids it.' } },
  { icon: '💭', name: 'DREAM', head: { de: 'Schlafphase', en: 'Sleep phase' }, body: { de: 'Destilliert die Erlebnisse seit dem letzten Schlag zu dauerhaften Einsichten — und zu konkreten Wünschen nach neuen Fähigkeiten.', en: 'Distills experience since the last beat into lasting insights — and into concrete wishes for new abilities.' } },
  { icon: '🔥', name: 'DRIVE', head: { de: 'Neugier', en: 'Curiosity' }, body: { de: 'Sucht Lücken im eigenen Wissen und formuliert daraus ein neues Ziel — auf Deutsch, mit lesbarer Begründung. Geflüsterte Ziele des Erschaffers haben Vorfahrt.', en: 'Finds gaps in its own knowledge and turns them into a new goal — in plain language, with a readable “why”. Whispered goals outrank curiosity.' } },
  { icon: '🌍', name: 'SIMULATE', head: { de: 'Weltmodell', en: 'World model' }, body: { de: 'Trockentest vor der Tat: Der Plan läuft erst im Kopf, Risiken und Revisionen werden vorher sichtbar.', en: 'A dry run before acting: the plan runs in the head first, exposing risks and revisions upfront.' } },
  { icon: '🐜', name: 'ACT', head: { de: 'Schwarm', en: 'Swarm' }, body: { de: 'Planner → Researcher → Builder → Critic, bis zu drei Runden. Ab Score 8 gilt das Ziel als erreicht und schließt sein eigenes GitHub-Issue.', en: 'Planner → Researcher → Builder → Critic, up to three rounds. From score 8 the goal counts as reached and closes its own GitHub issue.' } },
  { icon: '✋', name: 'HANDS', head: { de: 'Motorik', en: 'Motor system' }, body: { de: 'Führt echten Python-Code in einer Sandbox aus. Was funktioniert, wandert als wiederverwendbares Werkzeug in die Werkzeugkiste.', en: 'Runs real Python in a sandbox. Whatever works becomes a reusable tool in the toolbelt.' } },
  { icon: '🧬', name: 'EVOLUTION', head: { de: 'Fortpflanzung', en: 'Reproduction' }, body: { de: 'Unter Score 8 werden Varianten gezüchtet. Der Sieger wird vererbt, die Verlierer werden zu verbotenen Anti-Mustern — derselbe Fehler zweimal ist teuer.', en: 'Below score 8 variants are bred. The winner is inherited, the losers become forbidden anti-patterns — the same mistake twice is expensive.' } },
  { icon: '🕸', name: 'GRAPH', head: { de: 'Assoziativer Cortex', en: 'Associative cortex' }, body: { de: 'Baut den Wissensgraphen und das 3D-Gehirn neu. Synapsen entstehen nach Bedeutung, nicht nach Wortgleichheit: „Timeout beim Bauen“ findet „wegen Zeitüberschreitung abgebrochen“.', en: 'Rebuilds the knowledge graph and the 3D brain. Synapses form by meaning, not word overlap: “timeout during build” finds “aborted due to time exceeded”.' } },
  { icon: '💡', name: 'IDEEN', head: { de: 'Notizbuch', en: 'Notebook' }, body: { de: 'Schreibt das öffentliche Ideen-Board neu: eigene Ziele, Fähigkeits-Wünsche, Traum-Erkenntnisse der letzten 72 Stunden.', en: 'Rewrites the public ideas board: its own goals, skill wishes and dream insights from the last 72 hours.' } },
  { icon: '🪞', name: 'RETRO', head: { de: 'Gewissen', en: 'Conscience' }, body: { de: 'Bewertet den eigenen Zyklus schonungslos. „Ø Score nur 1,5/10 — Code-Pflicht noch zu schwach“ wird als Lehre gespeichert und landet im nächsten Planner-Prompt.', en: 'Judges its own cycle without mercy. “Avg score only 1.5/10 — code mandate still too weak” is stored as a lesson and lands in the next planner prompt.' } },
  { icon: '🎯', name: 'WILLE', head: { de: 'Präfrontaler Cortex', en: 'Prefrontal cortex' }, body: { de: 'Langfristige Missionen mit messbaren Zielen überdauern die Zyklen und schlagen die Tagesneugier.', en: 'Long-term missions with measurable targets survive cycles and outrank daily curiosity.' } },
]

export const organs: {
  icon: string; name: string; analog: L; body: L; accent: string
  /** which phase of the 5-minute cycle wakes this organ up */
  phase?: string
  /** organs that never stop (they run inside every other phase) */
  always?: boolean
}[] = [
  { icon: '💓', name: 'HERZ', analog: { de: 'Herzschlag', en: 'Heartbeat' }, body: { de: '5-Minuten-Takt, ~288 Zyklen pro Tag. Fährt jede Phase, meldet den Beweis nach Telegram, pusht sich selbst nach GitHub.', en: '5-minute cadence, ~288 cycles a day. Runs every phase, reports proof to Telegram, pushes itself to GitHub.' }, accent: 'pulse' , always: true },
  { icon: '🧬', name: 'GENOM', analog: { de: 'Angeborene DNA', en: 'Innate DNA' }, body: { de: 'Fünf Instinkt-Regeln in JEDEM Prompt: Gedächtnis schützen, Erschaffer zuerst, sich selbst am Leben halten, ehrlich bleiben, aus jedem Fehler lernen.', en: 'Five instinct rules in EVERY prompt: protect memory, creator first, stay alive, stay honest, learn from every failure.' }, accent: 'amber' , always: true },
  { icon: '🧠', name: 'GEDÄCHTNIS', analog: { de: 'Hippocampus', en: 'Hippocampus' }, body: { de: 'JSONL-Fakten plus Ereignisprotokoll, automatisch dedupliziert. Jede Erinnerung wird im Graphen zu einem Neuron.', en: 'JSONL facts plus an event log, auto-deduplicated. Every memory becomes a neuron in the graph.' }, accent: 'synapse' , phase: 'PRUNE' },
  { icon: '🕸', name: 'SEMANTIK', analog: { de: 'Bedeutungs-Cortex', en: 'Meaning cortex' }, body: { de: 'TF-IDF mit Synonymfeldern und Cross-Domain-Brücken. Findet verwandtes Wissen über Bedeutung — auch wenn kein Wort übereinstimmt.', en: 'TF-IDF with synonym fields and cross-domain bridges. Finds related knowledge by meaning — even when no word matches.' }, accent: 'synapse' , phase: 'GRAPH' },
  { icon: '🔥', name: 'DRIVE', analog: { de: 'Neugier', en: 'Curiosity' }, body: { de: 'Erzeugt eigene Ziele aus Wissenslücken und frischen Signalen — mit menschenlesbarer Begründung.', en: 'Generates its own goals from knowledge gaps and fresh signals — with a human-readable reason.' }, accent: 'amber' , phase: 'DRIVE' },
  { icon: '💭', name: 'DREAM', analog: { de: 'Schlaf & Replay', en: 'Sleep & replay' }, body: { de: 'Verdichtet Erfahrung zu Einsicht. Aus 4.000 Ereignissen werden Sätze, die der nächste Planer wirklich liest.', en: 'Condenses experience into insight. 4,000 events become sentences the next planner actually reads.' }, accent: 'amber' , phase: 'DREAM' },
  { icon: '🪞', name: 'METACOG', analog: { de: 'Selbstwahrnehmung', en: 'Self-awareness' }, body: { de: 'Sagt den eigenen Score voraus und misst, wie sehr es sich überschätzt hat. Kalibrierung statt Selbstlob.', en: 'Predicts its own score and measures how badly it overestimated. Calibration instead of self-praise.' }, accent: 'ink' , phase: 'RETRO' },
  { icon: '🌍', name: 'SIMULATE', analog: { de: 'Weltmodell', en: 'World model' }, body: { de: 'Probiert Pläne im Kopf, bevor Hände sie ausführen. Verdikt: go, revise oder stop.', en: 'Tries plans in its head before hands execute them. Verdict: go, revise or stop.' }, accent: 'ink' , phase: 'SIMULATE' },
  { icon: '👁', name: 'SINNE', analog: { de: 'Augen & Ohren', en: 'Eyes & ears' }, body: { de: 'Beobachtet die Hacker-News-Frontier und das Web. Frische Signale füttern die Neugier.', en: 'Watches the Hacker News frontier and the web. Fresh signals feed curiosity.' }, accent: 'synapse' , phase: 'DRIVE' },
  { icon: '✋', name: 'HÄNDE', analog: { de: 'Motorik', en: 'Motor system' }, body: { de: 'Sandbox-Ausführung mit Timeout und Gefahrenfilter. Erfolge werden zu Werkzeugen, die der Reflex ohne Modell aufruft.', en: 'Sandboxed execution with timeout and danger filter. Successes become tools the reflex calls without a model.' }, accent: 'moss' , phase: 'HANDS' },
  { icon: '🧬', name: 'EVOLUTION', analog: { de: 'Selektion', en: 'Selection' }, body: { de: 'Mehrere Angriffswinkel pro Fehlschlag, der Critic wählt den fittesten. Verlierer werden dauerhaft verboten.', en: 'Several attack angles per failure, the critic picks the fittest. Losers are permanently forbidden.' }, accent: 'moss' , phase: 'EVOLUTION' },
  { icon: '🩸', name: 'STOFFWECHSEL', analog: { de: 'Stressachse', en: 'Stress axis' }, body: { de: 'Rate-Limits und Timeouts erhöhen den Stresspegel — dann werden die Pläne kleiner. Cortisol baut sich wieder ab.', en: 'Rate limits and timeouts raise stress — then plans get smaller. Cortisol decays again.' }, accent: 'pulse' , always: true },
  { icon: '🛡', name: 'CRITIC', analog: { de: 'Erworbene Immunität', en: 'Adaptive immunity' }, body: { de: 'Gegnerisches Qualitätstor, Temperatur 0. Verlangt lauffähigen Code statt schöner Prosa. Bei gescheiterten Tasks hart auf 3 gedeckelt.', en: 'Adversarial quality gate, temperature 0. Demands runnable code, not pretty prose. Hard-capped at 3 for failed tasks.' }, accent: 'pulse' , phase: 'ACT' },
  { icon: '📖', name: 'LEHRER', analog: { de: 'Erschaffer-Kanal', en: 'Creator channel' }, body: { de: 'Wissen des Menschen fließt als creator_teaching-Fakt ein — höchste Autorität direkt nach dem Genom.', en: 'Human knowledge flows in as a creator_teaching fact — highest authority right after the genome.' }, accent: 'amber' , phase: 'WILLE' },
  { icon: '🧠', name: 'SELBSTLERNEN', analog: { de: 'Statistik ohne LLM', en: 'Statistics without an LLM' }, body: { de: 'Werkzeug-Erfolgsquoten und Score-Historie werden ohne einen einzigen Token zu Strategie- und Anti-Muster-Fakten.', en: 'Tool success rates and score history become strategy and anti-pattern facts without a single token.' }, accent: 'moss' , phase: 'RETRO' },
  { icon: '💬', name: 'FLÜSTERN', analog: { de: 'Menschliche Stimme', en: 'Human voice' }, body: { de: 'Ein Mensch kann ein Ziel in die Warteschlange flüstern. Es überholt alles — und wird als Eingriff protokolliert.', en: 'A human can whisper a goal into the queue. It jumps the line — and is logged as an intervention.' }, accent: 'amber' , phase: 'IDEEN' },
]

export const sections = {
  takt: {
    label: { de: 'Der Takt', en: 'The cadence' },
    head: { de: 'Alle fünf Minuten\nein vollständiger Zyklus.', en: 'Every five minutes,\na complete cycle.' },
    sub: { de: '~288 Mal am Tag, ohne einen einzigen menschlichen Klick. Scrolle den Takt entlang — genau in dieser Reihenfolge läuft jeder Herzschlag.', en: '~288 times a day, without a single human click. Scroll along the cadence — every heartbeat runs in exactly this order.' },
  },
  organe: {
    label: { de: 'Die Organe', en: 'The organs' },
    head: { de: 'Sechzehn Organe,\nein Kreislauf.', en: 'Sixteen organs,\none circulation.' },
    sub: { de: 'Jedes Organ hat ein Vorbild in der Natur und eine Datei im Code. Zieh die Karten — oder scroll einfach weiter.', en: 'Every organ has an analog in nature and a file in the code. Drag the cards — or just keep scrolling.' },
  },
  gehirn: {
    label: { de: 'Live-Organ', en: 'Live organ' },
    head: { de: 'Sein Gehirn.\nJetzt gerade.', en: 'Its brain.\nRight now.' },
    sub: { de: 'Keine Illustration, kein Video: Diese Ansicht wird bei jedem Herzschlag neu aus dem echten Gedächtnis gezeichnet — jedes Neuron lässt sich öffnen.', en: 'No illustration, no video: this view is drawn from real memory on every heartbeat — every neuron can be opened.' },
  },
  gedaechtnis: {
    label: { de: 'Das Gedächtnis', en: 'The memory' },
    head: { de: 'Was es weiß —\nund wie ehrlich es darüber ist.', en: 'What it knows —\nand how honest it is about it.' },
    sub: { de: 'Fakten, Träume, Narben. Anti-Muster sind Fehler, die es nie wieder machen darf. Direkt aus dem öffentlichen Logbuch geladen.', en: 'Facts, dreams, scars. Anti-patterns are mistakes it must never repeat. Loaded straight from the public logbook.' },
  },
  lernkurve: {
    label: { de: 'Die Lernkurve', en: 'The learning curve' },
    head: { de: 'Wird es besser?\nHier steht die Antwort.', en: 'Is it getting better?\nHere is the answer.' },
    sub: { de: 'Jeder Lauf endet mit einer Note von 0 bis 10, vergeben von einem gegnerischen Critic. Alle Urteile, die noch im Gedächtnis liegen — ungefiltert, in der Reihenfolge, in der sie gefallen sind.', en: 'Every run ends with a 0–10 verdict from an adversarial critic. All verdicts still held in memory — unfiltered, in the order they happened.' },
  },
  ideen: {
    label: { de: 'Ideen-Board', en: 'Ideas board' },
    head: { de: 'Ideen, die niemand\nbestellt hat.', en: 'Ideas nobody\nordered.' },
    sub: { de: 'Alles hier hat Zoetron selbst erfunden — Fähigkeiten, die es sich wünscht, Ziele, die es sich selbst setzt, Erkenntnisse aus der Traumphase.', en: 'Everything here Zoetron invented by itself — abilities it wishes for, goals it sets itself, insights from its dream phase.' },
  },
  wiki: {
    label: { de: 'Das Wiki', en: 'The wiki' },
    head: { de: 'Sein Handbuch —\nvon ihm selbst geschrieben.', en: 'Its manual —\nwritten by itself.' },
    sub: { de: 'Architektur, Organe, Notensystem, Werkzeugkiste, Roadmap und die Wochenreports — jede Seite schreibt der Organismus selbst und spiegelt sie bei jedem Herzschlag hierher. Direkt lesbar, statt als rohe Datei.', en: 'Architecture, organs, scoring, toolbelt, roadmap and the weekly reports — the organism writes every page itself and mirrors it here on every heartbeat. Readable right away instead of as a raw file.' },
  },
  zugang: {
    label: { de: 'Zugang', en: 'Access' },
    head: { de: 'Der Quellcode ist zu.\nDas Logbuch ist offen.', en: 'The source is closed.\nThe logbook is open.' },
    sub: { de: 'Zusehen kostet nichts und ist ausdrücklich erwünscht. Zugang zum Code gibt es nur auf eine ernst gemeinte, schriftliche Anfrage — mit Vertrag und NDA.', en: 'Watching is free and explicitly welcome. Access to the code exists only on a serious, written request — with contract and NDA.' },
  },
}

export const tiers: {
  key: string
  name: L
  price: L
  priceNote: L
  body: L
  items: L[]
  cta: L
  href: string
  featured?: boolean
}[] = [
  {
    key: 'observer',
    name: { de: 'Beobachter', en: 'Observer' },
    price: { de: '0 €', en: '€0' },
    priceNote: { de: 'für immer offen', en: 'open forever' },
    body: { de: 'Das komplette öffentliche Logbuch des Organismus — ohne Anmeldung, ohne Zähler.', en: 'The organism’s complete public logbook — no signup, no counter.' },
    items: [
      { de: 'Live-3D-Gehirn und Wissensgraph', en: 'Live 3D brain and knowledge graph' },
      { de: 'Gedächtnis, Bestenliste, Ideen-Board', en: 'Memory, leaderboard, ideas board' },
      { de: 'Wiki, Wochenreports, Roadmap', en: 'Wiki, weekly reports, roadmap' },
      { de: 'Issues als öffentliches Task-Board', en: 'Issues as a public task board' },
    ],
    cta: { de: 'Gehirn öffnen', en: 'Open the brain' },
    href: './brain.html',
  },
  {
    key: 'research',
    name: { de: 'Forschungslizenz', en: 'Research licence' },
    price: { de: 'auf Anfrage', en: 'on request' },
    priceNote: { de: 'Vertrag + NDA', en: 'contract + NDA' },
    body: { de: 'Quellcode-Zugang für benannte Personen mit echtem Vorhaben. Kein Preis von der Stange — der Umfang entscheidet.', en: 'Source access for named people with a real purpose. No off-the-shelf price — scope decides.' },
    items: [
      { de: 'Zugang zum gesperrten Bereich (src/, tests/)', en: 'Access to the locked area (src/, tests/)' },
      { de: 'Architektur-Durchsprache mit dem Erschaffer', en: 'Architecture walkthrough with the creator' },
      { de: 'Eigene Instanz des Herzschlags betreiben', en: 'Run your own heartbeat instance' },
      { de: 'Nennung in der Forschungs-Historie', en: 'Named in the research history' },
    ],
    cta: { de: 'Ernsthafte Anfrage stellen', en: 'Make a serious request' },
    href: 'https://github.com/djlex83',
    featured: true,
  },
  {
    key: 'partner',
    name: { de: 'Partnerschaft', en: 'Partnership' },
    price: { de: 'individuell', en: 'bespoke' },
    priceNote: { de: 'nach Anliegen, nicht nach Liste', en: 'by purpose, not by price list' },
    body: { de: 'Gemeinsame Weiterentwicklung: eigene Organe, eigener Flüster-Kanal, Betrieb auf eurer Infrastruktur.', en: 'Joint development: your own organs, your own whisper channel, running on your infrastructure.' },
    items: [
      { de: 'Flüster-Kanal mit Vorfahrt vor der Neugier', en: 'Whisper channel that outranks curiosity' },
      { de: 'Neue Organe nach eurem Anwendungsfall', en: 'New organs for your use case' },
      { de: 'Betrieb, Überwachung, Telegram-Beweise', en: 'Operation, monitoring, Telegram proofs' },
      { de: 'Direkter Draht statt Ticketsystem', en: 'A direct line instead of a ticket system' },
    ],
    cta: { de: 'Gespräch anfragen', en: 'Request a conversation' },
    href: 'https://github.com/djlex83/zoetron/issues',
  },
]

export const accessNote: L = {
  de: 'Formlose Massen-Nachrichten, Werbeangebote und „Preis?“-Einzeiler werden ignoriert. Eine Anfrage braucht echten Namen, Hintergrund und ein konkretes Anliegen.',
  en: 'Generic mass messages, sales offers and one-line “price?” inquiries are ignored. A request needs a real name, background and a concrete purpose.',
}

export const honesty: L = {
  de: 'Ehrliches Etikett: früher Prototyp (v0.x). Der Critic ist streng, der Durchschnitts-Score liegt niedrig — genau das ist die Absicht. Jede Nicht-Konvergenz füttert die Evolution.',
  en: 'Honest label: early prototype (v0.x). The critic is strict and the average score is low — by design. Every non-convergence feeds evolution.',
}

export const footer = {
  tag: { de: 'Ein Organismus, der sich selbst dokumentiert.', en: 'An organism that documents itself.' },
  cols: [
    {
      head: { de: 'Live-Organe', en: 'Live organs' },
      links: [
        { label: { de: '3D-Gehirn', en: '3D brain' }, href: './brain.html' },
        { label: { de: 'Wissensgraph', en: 'Knowledge graph' }, href: './graph.html' },
        { label: { de: 'Bestenliste', en: 'Leaderboard' }, href: '#gehirn' },
        { label: { de: 'Ideen-Board', en: 'Ideas board' }, href: '#ideen' },
      ],
    },
    {
      head: { de: 'Logbuch', en: 'Logbook' },
      links: [
        { label: { de: 'Repository', en: 'Repository' }, href: 'https://github.com/djlex83/zoetron' },
        { label: { de: 'Wiki', en: 'Wiki' }, href: '#wiki' },
        { label: { de: 'Wochenreports', en: 'Weekly reports' }, href: '#wiki' },
        { label: { de: 'Task-Board', en: 'Task board' }, href: 'https://github.com/djlex83/zoetron/issues' },
      ],
    },
    {
      head: { de: 'Kontakt', en: 'Contact' },
      links: [
        { label: { de: '@djlex83', en: '@djlex83' }, href: 'https://github.com/djlex83' },
        { label: { de: 'Lizenz', en: 'Licence' }, href: 'https://github.com/djlex83/zoetron/blob/main/LICENSE' },
        { label: { de: 'Releases', en: 'Releases' }, href: 'https://github.com/djlex83/zoetron/releases' },
      ],
    },
  ],
  legal: {
    de: 'Alle Rechte vorbehalten. Nutzung, Kopieren und Weitergabe nur mit Genehmigung des Autors.',
    en: 'All rights reserved. Use, copying and distribution only with the author’s permission.',
  },
}
