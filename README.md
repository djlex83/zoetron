# 🫀 Zoetron

[🇩🇪 Deutsche Version](README_DE.md)

**An autonomous agent organism that gets smarter from every experience —
running on free OpenRouter models, with an AutoRouter immune to model mortality.**

Zoetron is not an agent framework. It is an **organism**: heartbeat, curiosity,
sleep, a world model, a self-model, and an immune system against dead models.

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
| 💓 HEART | heartbeat | `heartbeat_daemon.sh` | every **20 min**: REFLEX → PRUNE → DREAM → DRIVE → ACT (+HANDS) → GRAPH → report |
| 🔥 DRIVE | curiosity/drive | `drive.py` | generates **its own goals** from memory gaps — in plain German, with a human-readable "why" |
| 💭 DREAM | sleep/replay | `dream.py` | distills experiences into lasting insights + skill proposals |
| 🪞 METACOG | self-awareness | `metacog.py` | predicts its own scores, measures calibration |
| 🌍 SIMULATE | world model | `simulate.py` | dry-runs plans before acting on them |
| 👁 SENSES | eyes/ears | `senses.py` | watches HN frontier + web search; fresh signals feed DRIVE |
| ✋ HANDS | motor system | `hands.py` | executes artifact code in a sandbox; **successes become reusable tools** (`data/tools/`) |
| 🧬 EVOLUTION | reproduction | `evolution.py` | N solution variants → critic picks the fittest; winners are inherited, **losers become forbidden anti-patterns** (never repeated) |
| 🩸 METABOLISM | stress axis | `metabolism.py` | rate limits & timeouts raise stress → smaller plans; cortisol decay |
| ✂️ PRUNE | apoptosis | `prune.py` | archives stale memories, keeps recalled facts, insights are immortal |
| 🧬 AUTOROUTER | immune system | `router.py` | only free models WITH tool support; failover + 1h blacklist |
| 🛡 CRITIC | adaptive immunity | `swarm.py` | adversarial quality gate (score 0–10); demands runnable code, not prose |
| 🕸 GRAPH | associative cortex | `graph.py` | real knowledge graph over all memory (**368 nodes / 245 edges**), duplicate detection, similarity neighborhoods |
| ⚡ REFLEX PATH | spinal cord | ACT-first logic | checks the toolbelt **before** the LLM thinks — token-free runs for known work |
| 💬 WHISPER | human voice | `data/fluester_goals.json` | human priority goals jump the queue (logged as `drive_whisper`) |
| 🧠 Memory | hippocampus | `memory.py` | JSONL facts + event log + keyword recall |

## The Autonomous Loop

Every 20 minutes, Zoetron runs a full developer cycle **without human input**:

```
DRIVE picks a goal ──► GitHub Issue opened automatically
                       (label: status:in-arbeit)
        ──► Swarm plans, builds, critiques (score 0–10)
        ──► score ≥ 8: issue closes itself (status:erledigt) ✅
            score < 8: Evolution breeds better strategies
                       (status:evolviert), inherited by future runs
```

- **Scoring:** 0–10 from an adversarial critic LLM; 8+ = converged.
  Details: [Wiki → Scoring](../../wiki/Scoring)
- **Whisper channel:** humans can inject priority goals via
  `data/fluester_goals.json` — Zoetron executes them before its own curiosity
  and logs the intervention as `drive_whisper`.
- **Public self-management:** issues, label kanban, releases, wiki and the
  landing page are maintained by the organism itself.

## Quick Start

```bash
git clone https://github.com/djlex83/zoetron && cd zoetron
python3 -m venv .venv && .venv/bin/pip install -e .
echo "OPENROUTER_API_KEY=sk-or-..." > .env
echo "ZOETRON_MODEL=auto" >> .env        # AutoRouter = model immortality

.venv/bin/python -m zoetron.cli run "Your goal" --swarm --save-artifacts out/
.venv/bin/python -m zoetron.cli models   # inspect the live routing queue
.venv/bin/python -m zoetron.cli drive    # let it generate its own goals
.venv/bin/python -m zoetron.cli dream    # sleep phase: consolidate experience
.venv/bin/python -m zoetron.cli status   # self-model & calibration
```

Without an API key: deterministic mock brain, all 34 tests pass fully offline.
`ZOETRON_MODEL=auto` automatically discovers every free tool-capable OpenRouter
model and learns from its own runs which ones perform well.

## Why This Exists

Today's LLM agents are oracles on demand: frozen weights, no goals of their
own, no sleep, no self-knowledge. Zoetron builds the missing organs in
software — as an open, self-hostable step toward continuously learning systems.

## Status

Early prototype (v0.x), active development, design changes fast. First live
runs showed: the critic catches real product inconsistencies, DREAM diagnoses
pipeline bugs from its own experience, and the AutoRouter skips dead models
automatically. **Milestone:** the first fully autonomous goal converged
(score 8/10) and closed its own GitHub issue — the complete
think → act → assess → close loop now runs unattended on every heartbeat.

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
