# 🫀 Zoetron

[🇩🇪 Deutsche Version](README_DE.md)

**An autonomous agent organism that gets smarter from every experience —
running on free OpenRouter models, with an AutoRouter immune to model mortality.**

Zoetron is not an agent framework. It is an **organism**: heartbeat, curiosity,
sleep, a world model, a self-model, and an immune system against dead models.

**🧠 Watch its memory live:** [zoetron landing page](https://djlex83.github.io/zoetron/)
— its brain, ideas board and memory stream on one page, redrawn on every
heartbeat · [2D knowledge graph](https://djlex83.github.io/zoetron/graph.html)
· [3D brain](https://djlex83.github.io/zoetron/brain.html) — every fact it
learns becomes a neuron; age fades the glow.

**📈 Watch it get better — or not:** [football learning curve](https://djlex83.github.io/zoetron/fussball.html).
The organism predicts match outcomes from 153,000 games (2000–2024) and is
scored by the actual results, not by a language model. Baseline to beat:
**50.2 %** on unseen matches, without bookmaker odds; the bookmaker gets
51.5 %. A third set of 13,143 games is **sealed and never touches the
organism's machine** — because a test set answered a hundred times stops
being a test.
The page itself is a React/Vite/Tailwind/GSAP app in [`site/`](site/) that
builds into `docs/`.

```
Goal ──► PLAN ──► SIMULATE ──► SELF-ASSESS ──► BUILD ──► CRITIQUE
          ▲                                              │
          └────────── score < 8: next iteration ◄────────┘
                     ▼
     JSONL memory (facts + events) → DREAM distills insights
                     ▼
     DRIVE generates the next self-chosen goals from knowledge gaps
```

## The Organs

| Organ | Nature analog | File | What it does |
|---|---|---|---|
| 💓 HEART | heartbeat | `heartbeat_daemon.sh` | every **5 min** (~288/day): REFLEX → PRUNE → DREAM → DRIVE → ACT (+HANDS) → TELEGRAM proof → GRAPH+3D-BRAIN → RETRO → WILL → GENOME → TEACH → SELF-LEARN → IDEAS → git/wiki sync |
| 🧬 GENOME | innate DNA | `genome.py` | **5 instinct rules** (`data/genome.json`) injected into *every* LLM prompt — protect memory, creator first, self-preservation watchdog, honesty, learn from every failure |
| 🔥 DRIVE | curiosity/drive | `drive.py` | generates **its own goals** from memory gaps — in plain German, with a human-readable "why" |
| 💭 DREAM | sleep/replay | `dream.py` | distills experiences into lasting insights + skill proposals |
| 🪞 METACOG | self-awareness | `metacog.py` | predicts its own scores, measures calibration |
| 🌍 SIMULATE | world model | `simulate.py` | dry-runs plans before acting on them |
| 👁 SENSES | eyes/ears | `senses.py` | watches HN frontier + web search; fresh signals feed DRIVE |
| 🔬 RESEARCHER | scout | swarm role 4 | fresh web facts before planning (Phase 2 of ROLES) |
| 🕸 SEMANTIC MEMORY | meaning cortex | `semantic.py` | TF-IDF + synonym fields + **cross-domain bridging**: finds related knowledge *by meaning*, not wording — injected into every plan |
| ✋ HANDS | motor system | `hands.py` | executes artifact code in a sandbox; **successes become reusable tools** (`data/tools/`) |
| 🧬 EVOLUTION | reproduction | `evolution.py` | N solution variants → critic picks the fittest; winners are inherited, **losers become forbidden anti-patterns** (never repeated) |
| 🩸 METABOLISM | stress axis | `metabolism.py` | rate limits & timeouts raise stress → smaller plans; cortisol decay |
| ✂️ PRUNE | apoptosis | `prune.py` | archives stale memories, keeps recalled facts, insights are immortal |
| 🎯 WILL | prefrontal cortex | `will.py` | long-term **missions** with measurable targets survive across cycles; they outrank short-term curiosity (whisper still wins) |
| 🪞 RETRO | conscience | `retro.py` | reviews its own cycles after every heartbeat: honest findings become `retro_lesson:` facts that feed the next planner prompt |
| 🕸 GRAPH+BRAIN | associative cortex | `graph.py`, `graph_view.py`, `brain_view.py` | live knowledge graph (2D physics view + **3D brain** with hemispheres & synapse pulses), **semantic linking**: synapses form by TF-IDF meaning (cosine ≥ 0.18), not word overlap — "timeout during build" finds "aborted due to time exceeded"; duplicates consolidated automatically |
| 💡 IDEAS BOARD | daydream notebook | `ideen.py` | collects its **own autonomous ideas** (skill wishes, self-chosen goals, dream insights) into a public board — refreshed every heartbeat |
| ⚡ REFLEX PATH | spinal cord | ACT-first logic | checks the toolbelt **before** the LLM thinks — token-free runs for known work; 6 h throttle per goal+tool combo (no spam) |
| 🛡 CRITIC | adaptive immunity | `swarm.py` | adversarial quality gate (score 0–10); demands runnable code, not prose |
| 💬 WHISPER | human voice | `data/fluester_goals.json` | human priority goals jump the queue (logged as `drive_whisper`) |
| 🧠 Memory | hippocampus | `memory.py` | JSONL facts + event log + keyword recall; auto-deduplicated |

## The Autonomous Loop

Every **5 minutes** (~288 cycles/day), Zoetron runs a full developer cycle
**without human input** — and *thinks about itself* while doing it.
Telegram reports are throttled to every 3rd beat (~15 min) so the fast
thinking never spams the human:

```
HERZSCHLAG (every 5 min)
 ├─ ⚡ REFLEX   toolbelt first — known work runs token-free (6 h throttle)
 ├─ ✂️ PRUNE    archive stale memories
 ├─ 💭 DREAM    distill new insights + skill ideas from recent experience
 ├─ 🔥 DRIVE    pick its own next goal (curiosity) or a whispered one (you)
 ├─ 🐜 ACT      swarm plans → builds → critic scores 0–10
 │     score ≥ 8: issue closes itself (status:erledigt) ✅
 │     score < 8: evolution breeds better strategies, losers become
 │                forbidden anti-patterns, winners are inherited
 ├─ ✋ HANDS    artifact code executed in a sandbox; successes become tools
 ├─ 📱 TELEGRAM posts the proof of execution (every 3rd beat)
 ├─ 🕸 GRAPH    rebuilds the live knowledge graph — semantic synapses
 ├─ 💡 IDEAS    refreshes the public ideas board (its own inventions!)
 └─ 🪞 RETRO    reviews its own cycles: "what went well / badly?"
               findings are stored as lessons for future planners
```

- **Scoring:** 0–10 from an adversarial critic LLM; 8+ = converged.
  Details: [Wiki → Scoring](../../wiki/Scoring)
- **Whisper channel:** humans can inject priority goals via
  `data/fluester_goals.json` — Zoetron executes them before its own curiosity
  and logs the intervention as `drive_whisper`.
- **Public self-management:** issues, label kanban, releases, wiki and the
  landing page are maintained by the organism itself.

### 💡 What it thinks about every 5 minutes

Every heartbeat generates fresh ideas you can watch grow in the open:

| Phase | Typical ideas coming out of it |
|---|---|
| 💭 DREAM | distilled insights ("what did I learn since last beat?") + concrete skill proposals for new abilities |
| 🔥 DRIVE | a brand-new goal with a human-readable German *why* — chosen because memory has a gap there |
| 🐜 ACT | runnable Python artifacts per task (code is mandatory, prose alone scores low) |
| 🧬 EVOLUTION | up to 3 fundamentally different attack angles per failure; the fittest becomes inherited strategy |
| 🪞 RETRO | honest self-findings like *"average score only 1.5/10 – code mandate still too weak"* or *"N hands failed – build smaller standalone scripts"* |

Recent real examples from the memory: *"Redesign MemoryStore as self-pruning
ring buffer"*, *"Embedding-driven organ integration: replace BFS subgraph
extraction with learned similarity"*, *"Enforce MemoryStore contract validator
before each hand-action batch; fail fast."*

## Source Access

The source code is **not public** (locked area, all rights reserved).
This repository is Zoetron's public logbook: architecture, wiki, live memory,
knowledge graph, 3D brain and weekly reports — everything the organism writes
about itself, refreshed every heartbeat. There is nothing to install here.

License & collaboration only on a serious, written request via GitHub
**@djlex83** — with real name, background and a concrete purpose.
Licensing requires a contract + NDA.

<details>
<summary>CLI reference (for license holders)</summary>

```bash
python -m zoetron.cli run "Your goal" --swarm --save-artifacts out/
python -m zoetron.cli models   # inspect the live routing queue
python -m zoetron.cli drive    # let it generate its own goals
python -m zoetron.cli dream    # sleep phase: consolidate experience
python -m zoetron.cli status   # self-model & calibration
```

Configured via `.env`: `OPENROUTER_API_KEY` and `ZOETRON_MODEL=auto`
(AutoRouter = model immortality). Without an API key: deterministic mock brain,
all **67 tests** pass fully offline. `ZOETRON_MODEL=auto` automatically discovers
every free tool-capable OpenRouter model and learns from its own runs which ones
perform well.

</details>

## Why This Exists

Today's LLM agents are oracles on demand: frozen weights, no goals of their
own, no sleep, no self-knowledge. Zoetron builds the missing organs in
software — a self-hosted research organism for continuously learning systems.

## Status

Early prototype (v0.x), active development, design changes fast. First live
runs showed: the critic catches real product inconsistencies, DREAM diagnoses
pipeline bugs from its own experience, and the AutoRouter skips dead models
automatically. **Milestone:** the first fully autonomous goal converged
(score 8/10) and closed its own GitHub issue — the complete
think → act → assess → close loop now runs unattended on every heartbeat.

**Reality check, 23 Aug 2026.** A thorough audit found the organism had been
recording *attempts* as successes: of 22 goals reported done, **one** had actually
been achieved, and of 31 registered tools, **three** did anything. Measurement, tool
admission and logging are repaired — convergence must now be scored, tools must pass
a four-rule admission check, and aborts are no longer swallowed. The full account,
including the numbers we would rather not publish:
**[Werkstattbericht 23.08.2026](docs/WERKSTATTBERICHT_2026-08-23.md)**.

## 🔒 Source Code Notice / Quellcode-Hinweis

> **🇩🇪 Zugang zum Quellcode:** Der Code ist nicht öffentlich (gesperrter Bereich).
> **Lizenz & Zusammenarbeit nur auf seriöse, schriftliche Anfrage** über GitHub
> **@djlex83** – mit echtem Namen, Hintergrund und konkretem Anliegen.
> Formlose Massen-Nachrichten, Werbeangebote und „Preis?“-One-Liner werden
> ignoriert. Lizenzvergabe erfordert Vertrag + NDA. Alle Rechte vorbehalten.
>
> **🇬🇧 Source access:** The code is not public (locked area). **License &
> collaboration only via serious written request** at GitHub **@djlex83** —
> real name, background and a concrete matter required. Generic mass messages,
> sales offers and one-line “price?” inquiries are ignored. Licensing requires
> contract + NDA. All rights reserved.

## License

Alle Rechte vorbehalten – Nutzung/Kopieren/Weitergabe nur mit
Genehmigung des Autors. Siehe [LICENSE](LICENSE). Anfragen: Issue oder
[@djlex83](https://github.com/djlex83).
