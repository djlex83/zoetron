"""Zoetron CLI."""
from __future__ import annotations

import argparse
import json
import re
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

    sub.add_parser("prune", help="Apoptosis: archive stale memories")

    p_hands = sub.add_parser("hands",
                             help="Motor organ: run real code for a task")
    p_hands.add_argument("task", help="what should be done")

    p_evo = sub.add_parser("evolve",
                           help="Evolution: N variants, critic picks the fittest")
    p_evo.add_argument("problem", help="the problem to attack")
    p_evo.add_argument("--n", type=int, default=3, help="number of variants")

    sub.add_parser("act",
                   help="Close the loop: run the swarm on the newest "
                        "unhandled DRIVE goal")

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

    if args.cmd == "prune":
        from .prune import Prune
        stats = Prune(cfg).run()
        print(f"prune: {stats['facts_pruned']} Fakten archiviert, "
              f"{stats['events_pruned']} Ereignisse archiviert")
        return 0

    if args.cmd == "hands":
        from .hands import Hands
        out = Hands(cfg).do_task(args.task)
        print(json.dumps(out, ensure_ascii=False, indent=1)[:1200])
        return 0 if out.get("ok") else 1

    if args.cmd == "act":
        # Close the loop: pick the newest unhandled DRIVE goal and let the
        # swarm actually work on it. Handled goals get an event marker.
        from .memory import MemoryStore
        mem = MemoryStore(cfg.data_dir / "memory")
        handled = {str((e.get("payload") or {}).get("goal_title", ""))
                   for e in mem.events(kind="act_done", limit=200)}
        goal = None
        # FLUESTER-PRIO: ungewisperte Ziele aus data/fluester_goals.json
        # haben absolute Vorfahrt vor den DRIVE-Zielen.
        try:
            _wpath = Path(cfg.data_dir) / "fluester_goals.json"
            _wgoals = json.loads(_wpath.read_text()) if _wpath.exists() else []
            for _wg in (_wgoals if isinstance(_wgoals, list) else []):
                if isinstance(_wg, dict) and not _wg.get("_done") \
                        and _wg.get("title"):
                    _wg["_done"] = True
                    _wpath.write_text(json.dumps(
                        _wgoals, ensure_ascii=False, indent=1))
                    goal = str(_wg["title"])[:160]
                    mem.add_event("drive_whisper", {
                        "title": goal,
                        "why": str(_wg.get("why", ""))[:300]})
                    break
        except (OSError, json.JSONDecodeError):
            pass
        if not goal:
            for e in mem.events(kind="drive_goal", limit=50):
                title = str((e.get("payload") or {}).get("title", ""))
                if title and title not in handled:
                    goal = title
                    break
        if not goal:
            print("act: keine unbehandelten Ziele")
            return 0
        # REFLEX-PFAD: Erst die Werkzeugkiste fragen, bevor das LLM
        # denkt. Passt ein gespeichertes Tool zum Ziel, wird es
        # ausgefuehrt - ohne einen einzigen Token.
        def _reflex_try(g: str) -> bool:
            try:
                tdir = Path(cfg.data_dir) / "tools"
                tools = sorted(tdir.glob("*.py")) if tdir.exists() else []
            except OSError:
                return False
            words = [w for w in re.split(r"[^\w]+", g.lower())
                     if len(w) > 4]
            for tp in tools:
                body = tp.read_text(encoding="utf-8", errors="replace")
                stem = tp.stem.lower().replace("_", " ")
                low = body.lower()
                hits = sum(1 for w in words
                           if w in stem or w[:6] in low)
                fact_match = any(
                    w in f.get("key", "").lower()
                    + f.get("value", "").lower()[:200]
                    for f in mem.facts()
                    if f.get("key", "").startswith(f"tool:{tp.stem}")
                    for w in words)
                if (hits >= 1 or fact_match) and len(body.splitlines()) >= 3 \
                        and "add_argument" not in body:
                    from .hands import Hands
                    res = Hands(cfg, memory=mem).execute(body[:4000],
                                                         timeout=20.0)
                    mem.add_event("reflex_used", {
                        "goal": goal[:120], "tool": tp.name,
                        "ok": bool(res.get("ok"))})
                    print(f"reflex: {tp.name} -> "
                          f"{'ok' if res.get('ok') else 'fehler'} "
                          "(kein LLM-Token verbraucht)")
                    return True
            return False

        if _reflex_try(goal):
            _code, _data = 201, {"number": None}
            try:
                import importlib.util as _ilu2
                _spec2 = _ilu2.spec_from_file_location(
                    "gh_tools", Path(__file__).parent.parent.parent
                    / "scripts" / "gh_tools.py")
                _gh2 = _ilu2.module_from_spec(_spec2)
                _spec2.loader.exec_module(_gh2)
                _code, _data = _gh2._api("POST", "/issues", {"body": (
                    f"⚡ **Reflex-Lauf** (werkzeugkiste, kein LLM)\n\n"
                    f"- Ziel: {goal}\n- Tool aus data/tools/ ausgeführt\n"
                    f"- Ergebnis im Gedächtnis (`reflex_used`)")})
                if _code == 201:
                    _gh2._api("POST",
                              f"/issues/{_data.get('number')}/labels",
                              {"labels": ["drive-goal",
                                          "status:erledigt"]})
                    _gh2._api("PATCH",
                              f"/issues/{_data.get('number')}",
                              {"state": "closed"})
            except Exception as exc:  # noqa: BLE001
                mem.add_event("gh_issue_error", {
                    "where": "reflex-issue", "error": str(exc)[:150]})
            mem.add_event("act_done", {"goal_title": goal,
                                       "score": None,
                                       "converged": True,
                                       "mode": "reflex"})
            return 0
        print(f"act: fuehre aus -> {goal}")
        issue_num = None
        try:
            import importlib.util as _ilu
            _spec = _ilu.spec_from_file_location(
                "gh_tools", Path(__file__).parent.parent.parent
                / "scripts" / "gh_tools.py")
            _gh = _ilu.module_from_spec(_spec)
            _spec.loader.exec_module(_gh)
            _code, _data = _gh._api(
                "POST", "/issues",
                {"title": f"[Ziel] {goal[:180]}",
                 "body": f"Autonom generiertes DRIVE-Ziel.\n\n"
                         f"Ausgefuehrt vom Swarm im naechsten ACT-Lauf.",
                 "labels": ["drive-goal", "status:in-arbeit"]})
            if _code == 201:
                issue_num = _data.get("number")
                print(f"act: issue #{issue_num} angelegt")
            else:
                mem.add_event("gh_issue_error", {
                    "where": "act-create",
                    "error": getattr(_gh, "_LAST_ERR", None)
                    or f"HTTP {_code}"})
        except Exception as exc:  # noqa: BLE001 - GitHub may be unreachable
            mem.add_event("gh_issue_error", {
                "where": "act-create",
                "error": f"{type(exc).__name__}: {exc}"})
        from .swarm import SwarmOrchestrator
        report = SwarmOrchestrator(cfg, memory=mem).run(goal)
        mem.add_event("act_done", {"goal_title": goal,
                                   "score": report.get("score"),
                                   "converged": report.get("converged")})
        # HANDS im Kreislauf: Ausfuehrbaren Code aus den Artefakten
        # ziehen und in der Sandbox wirklich ausfuehren (max. 1 pro
        # Lauf) - Ergebnis fliesst als Fakt ins Gedaechtnis.
        try:
            import re as _re
            from .hands import Hands
            _hands = Hands(cfg, memory=mem)
            for _t in report.get("tasks", []):
                _blocks = _re.findall(
                    r"```(?:python|py)\n(.*?)```",
                    str(_t.get("artifact", "")), _re.S)
                if not _blocks:
                    continue
                _code_snip = _blocks[0][:4000]
                # Nur eigenstaendig lauffaehigen Code ausfuehren:
                # CLI-Tools mit Pflicht-Argumenten (argparse etc.)
                # koennen wir keine Parameter mitgeben.
                _needs_args = ("add_argument" in _code_snip
                               and "required" in _code_snip)
                if not _needs_args and len(_code_snip.splitlines()) >= 3:
                    _res = _hands.execute(_code_snip, timeout=20.0)
                    if _res.get("ok"):
                        # WERKZEUGKISTE: Erfolgreiche Skripte als
                        # wiederverwendbare Tools speichern.
                        _tname = _slug(goal)[:40]
                        _tdir = Path(cfg.data_dir) / "tools"
                        _tdir.mkdir(parents=True, exist_ok=True)
                        (_tdir / f"{_tname}.py").write_text(
                            _code_snip, encoding="utf-8")
                        mem.add_fact(
                            f"tool:{_tname}",
                            f"Ausfuehrbares Python-Werkzeug aus Ziel "
                            f"'{goal[:60]}'. Datei: data/tools/"
                            f"{_tname}.py - bei aehnlichen Zielen nutzen "
                            f"oder weiterentwickeln.",
                            source="hands")
                    else:
                        mem.add_fact(
                            f"hand_result:{goal[:80]}",
                            json.dumps({"ok": False,
                                        "stderr": (_res.get("stderr")
                                                   or "")[:200]},
                                       ensure_ascii=False),
                            source="hands")
                    print(f"hands: ausgefuehrt -> "
                          f"{'ok -> tool gesichert' if _res.get('ok') else 'fehler'}"
                          + ("" if _res.get("ok") else
                             f" | {(_res.get('stderr') or '')[:80]}"))
                    break
        except Exception as exc:  # noqa: BLE001 - motorics must not kill ACT
            mem.add_event("gh_issue_error", {
                "where": "hands-execute",
                "error": f"{type(exc).__name__}: {exc}"})
        winner = (report.get("evolution") or {}).get("winner_angle")
        line = (f"ACT: '{goal[:60]}' | Score {report.get('score')}/10, "
                f"{'konvergiert' if report.get('converged') else 'offen'}"
                + (f" | evolviert: {winner}" if winner else ""))
        print(line)
        if issue_num:
            try:
                _code, _ = _gh._api("POST", f"/issues/{issue_num}/comments",
                                    {"body": (
                                        f"**Ergebnis des ACT-Laufs**\n\n"
                                        f"- Score: {report.get('score')}/10\n"
                                        f"- Konvergiert: "
                                        f"{report.get('converged')}\n"
                                        + (f"- Evolvierte Strategie: "
                                           f"{winner}\n" if winner else "")
                                        + f"\n{line}"[:600])})
                _state = "closed" if report.get("converged") else "open"
                _tag = "erledigt" if _state == "closed" else "offen"
                _labels = (["status:erledigt"] if _state == "closed"
                           else ["status:evolviert"])
                _gh._api("PATCH", f"/issues/{issue_num}",
                         {"state": _state,
                          "title": "[{}] {}".format(_tag, goal[:160])})
                _gh._api("PUT", f"/issues/{issue_num}/labels",
                         {"labels": ["drive-goal"] + _labels})
                mem.add_event("issue_synced", {"issue": issue_num,
                                               "state": _state})
            except Exception:  # noqa: BLE001
                pass
        return 0


    if args.cmd == "evolve":
        from .evolution import Evolution
        out = Evolution(cfg).evolve(args.problem, n=args.n)
        print(json.dumps(out, ensure_ascii=False, indent=1)[:1200])
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
