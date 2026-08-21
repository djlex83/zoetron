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
| 💓 HEART | heartbeat | Hermes cron | every 30 min: PRUNE + DREAM + DRIVE + status report |
| 🔥 DRIVE | curiosity/drive | `drive.py` | generates **its own goals** from memory gaps |
| 💭 DREAM | sleep/replay | `dream.py` | distills experiences into lasting insights |
| 🪞 METACOG | self-awareness | `metacog.py` | predicts its own scores, measures calibration |
| 🌍 SIMULATE | world model | `simulate.py` | dry-runs plans before acting on them |
| 👁 SENSES | eyes/ears | `senses.py` | watches HN frontier + web search (via scrapling); fresh signals feed DRIVE |
| ✋ HANDS | motor system | `hands.py` | plans + **executes real code** (sandboxed); results flow back into memory |
| 🧬 EVOLUTION | reproduction | `evolution.py` | N distinct solution variants → critic selects the fittest; **losers trigger auto-evolution, winners are inherited by future planners** |
| 🩸 METABOLISM | stress axis | `metabolism.py` | rate limits & timeouts raise stress → smaller plans; cortisol decay |
| ✂️ PRUNE | apoptosis | `prune.py` | archives stale memories, keeps recalled facts, insights are immortal |
| 🧬 AUTOROUTER | immune system | `router.py` | only free models WITH tool support; failover + 1h blacklist; **experience beats metadata** (critic scores boost the routing chain) |
| 🛡 CRITIC | adaptive immunity | `swarm.py` | adversarial quality gate (score 0–10) |
| 🧠 Memory | hippocampus | `memory.py` | JSONL facts + event log + keyword recall |

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
automatically.

## License

MIT – see [LICENSE](LICENSE).
