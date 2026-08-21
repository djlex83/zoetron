"""Zoetron CLI."""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from .config import Config
from .core import ForgeAgent
from .memory import MemoryStore


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="zoetron",
                                     description="Recursive ASI-style agent loop")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_run = sub.add_parser("run", help="Run the forge loop on a goal")
    p_run.add_argument("goal", help="What should be forged?")
    p_run.add_argument("--cycles", type=int, default=3)
    p_run.add_argument("--save-artifacts", metavar="DIR",
                       help="Write artifacts as markdown files")
    p_run.add_argument("--swarm", action="store_true",
                       help="Multi-agent mode: planner/builder/critic as separate roles")

    sub.add_parser("status", help="Show memory/status digest")

    p_drive = sub.add_parser("drive", help="Curiosity engine: self-chosen goals")
    p_drive.add_argument("--pick", action="store_true",
                         help="Pick one goal curiosity-weighted and run it")
    p_drive.add_argument("--cycles", type=int, default=1)

    p_dream = sub.add_parser("dream", help="Sleep phase: consolidate experience")
    p_dream.add_argument("--lookback", type=int, default=50)

    sub.add_parser("models",
                   help="AutoRouter view: free tool-capable models, ranked")

    args = parser.parse_args(argv)
    cfg = Config()

    if args.cmd == "run":
        if args.swarm:
            from .swarm import SwarmOrchestrator
            orch = SwarmOrchestrator(cfg)
            rep = orch.run(args.goal, max_cycles=args.cycles)
            _print_swarm(rep)
            _save_swarm_artifacts(rep, args.save_artifacts)
            return 0

        agent = ForgeAgent(cfg)
        report = agent.run(args.goal, max_cycles=args.cycles)
        print(report.summary())
        if args.save_artifacts:
            outdir = Path(args.save_artifacts)
            outdir.mkdir(parents=True, exist_ok=True)
            for i, t in enumerate(report.tasks, 1):
                fp = outdir / f"{i:02d}_{_slug(t.title)}.md"
                fp.write_text(f"# {t.title}\n\n{t.artifact}", encoding="utf-8")
            print(f"artifacts -> {outdir.resolve()}")
        return 0

    if args.cmd == "drive":
        from .drive import Drive
        drive = Drive(cfg)
        if not args.pick:
            for i, g in enumerate(drive.generate_goals(), 1):
                print(f"{i}. {g.get('title', '')}\n   why: {g.get('why', '')} "
                      f"[{g.get('signal', '?')}]")
            return 0
        goal = drive.pick_goal()
        if not goal:
            print("DRIVE: keine Ziele generierbar (leerer Speicher?)")
            return 1
        print(f"DRIVE wählt: {goal.get('title', '')}")
        print(f"  why: {goal.get('why', '')}")
        from .swarm import SwarmOrchestrator
        rep = SwarmOrchestrator(cfg).run(str(goal.get("title", "")),
                                         max_cycles=args.cycles)
        _print_swarm(rep)
        _save_swarm_artifacts(rep, None)
        return 0

    if args.cmd == "dream":
        from .dream import Dream
        result = Dream(cfg).sleep(lookback=args.lookback)
        print(f"DREAM: {result['replayed_events']} Eintraege replayed")
        for ins in result["insights"]:
            print(f"  insight: {ins}")
        for sk in result["skill_proposals"]:
            print(f"  skill:   {sk}")
        return 0

    if args.cmd == "models":
        from .router import discover_free_tool_models, format_models_report
        mem = MemoryStore(cfg.data_dir / "memory")
        now = time.time()
        blacklisted = {
            e["payload"].get("model", "")
            for e in mem.events(kind="model_fail", limit=40)
            if now - e.get("ts", 0) < 3600
        }
        try:
            models = discover_free_tool_models(cfg.api_key, cfg.base_url)
        except Exception as exc:
            print(f"Discovery fehlgeschlagen: {exc}")
            return 1
        print(format_models_report(models, top_n=8, blacklisted=blacklisted))
        return 0

    if args.cmd == "status":
        mem = MemoryStore(cfg.data_dir / "memory")
        from .metacog import MetaCog
        model = MetaCog(cfg, memory=mem).self_model()
        print("== self-model ==")
        if model.get("n", 0) == 0:
            print(f"- {model.get('message', 'keine Daten')}")
        else:
            print(f"- Kalibrierung: MAE={model['mean_abs_error']} "
                  f"(recent {model['recent_mean_abs_error']}, {model['trend']})")
            print(f"- uebermutig={model['overconfident_runs']} "
                  f"zu bescheiden={model['underconfident_runs']} (n={model['n']})")
        print("== facts ==")
        for f in mem.facts()[-10:]:
            print(f"[{f['source']:>7}] {f['key']}: {f['value'][:100]}")
        print("== last events ==")
        for e in mem.events(limit=10):
            payload = str(e['payload'])[:90]
            print(f"- {e['kind']}: {payload}")
        return 0
    return 1


def _print_swarm(rep: dict) -> None:
    print(f"Zoetron SWARM '{rep['goal'][:60]}'")
    print(f"  mode={rep['mode']} cycles={rep['cycles']} "
          f"score={rep['score']}/10 converged={rep['converged']} "
          f"duration={rep['duration_s']}s")
    print(f"  role_calls={rep['role_calls']}")
    for i, t in enumerate(rep["tasks"], 1):
        print(f"  {i}. [{t['status']:>6}] {t['title'][:70]}")
    if rep["issues"]:
        print("  critic: " + "; ".join(rep["issues"][:3]))


def _save_swarm_artifacts(rep: dict, outdir_str: str | None) -> None:
    if not outdir_str:
        return
    outdir = Path(outdir_str)
    outdir.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(rep["tasks"], 1):
        fp = outdir / f"{i:02d}_{_slug(t['title'])}.md"
        fp.write_text(f"# {t['title']}\n\n{t['artifact']}", encoding="utf-8")
    print(f"artifacts -> {outdir.resolve()}")


def _slug(text: str) -> str:
    keep = [c.lower() if c.isalnum() else "-" for c in text]
    slug = "".join(keep).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug[:60] or "artifact"


if __name__ == "__main__":
    sys.exit(main())
