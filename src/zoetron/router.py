"""AUTOROUTER - immune system against model mortality.

Free models on OpenRouter come and go (ox-alpha is leaving soon). The
AutoRouter keeps Zoetron alive:

  1. DISCOVER : fetch /models, keep ONLY zero-cost models WITH tool support
                (hard rule: no tools -> rejected, whatever else it promises)
  2. RANK     : heuristic intelligence score from metadata
                (params, lab tier, context, role hints) + optional live probe
  3. FAILOVER : ResilientLLM walks the chain; failures blacklist a model
                for a cooldown hour (remembered in the JSONL memory)

ZOETRON_MODEL=auto activates it; explicit pinning still possible.
"""
from __future__ import annotations

import json
import re
import time
from typing import Any

import httpx

from .config import Config
from .llm import LLM, LLMResponse, Message
from .memory import MemoryStore

MODELS_URL = "https://openrouter.ai/api/v1/models"
COOLDOWN_S = 3600

# names of non-chat/specialist endpoints must never be routed
_BANNED = re.compile(
    r"safety|embed|whisper|tts|audio|video|image|-vl$|lyria|clip|rerank",
    re.IGNORECASE,
)
_PARAM_RE = re.compile(r"(\d+(?:\.\d+)?)\s*b\b", re.IGNORECASE)


# --------------------------------------------------------------------------- #
# Discovery + ranking                                                          #
# --------------------------------------------------------------------------- #
def discover_free_tool_models(api_key: str = "",
                              base_url: str = "https://openrouter.ai/api/v1",
                              timeout: float = 30.0) -> list[dict[str, Any]]:
    """All zero-cost models that support tool calling."""
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    resp = httpx.get(f"{base_url.rstrip('/')}/models", headers=headers,
                     timeout=timeout)
    resp.raise_for_status()
    out: list[dict[str, Any]] = []
    for m in resp.json().get("data", []):
        p = m.get("pricing") or {}
        if str(p.get("prompt")) != "0" or str(p.get("completion")) != "0":
            continue
        if "tools" not in (m.get("supported_parameters") or []):
            continue  # HARD RULE: no agent/tool support -> never routed
        out.append(m)
    return out


def rank_model(model: dict[str, Any]) -> float:
    """Heuristic intelligence score (higher = smarter expected)."""
    mid = (model.get("id") or "").lower()
    if _BANNED.search(mid):
        return -100.0
    score = 0.0
    params = _PARAM_RE.search(mid.replace("-", " "))
    if params:
        b = float(params.group(1))
        if b >= 300:
            score += 7          # huge MoE class
        elif b >= 100:
            score += 5
        elif b >= 30:
            score += 3
        elif b >= 15:
            score += 1.5
        else:
            score -= 1
    if "ultra" in mid:
        score += 3
    if "super" in mid:
        score += 1.5
    if "reasoning" in mid:
        score += 1
    if "nano" in mid or "mini" in mid or "-xs-" in mid:
        score -= 3
    labs = ("openai/", "google/", "deepseek", "qwen", "z-ai/", "mistral")
    if any(l in mid for l in labs):
        score += 2
    ctx = int(model.get("context_length") or 0)
    score += min(3.0, ctx / 200_000.0)      # long-context bonus, capped
    return round(score, 2)


def build_chain(models: list[dict[str, Any]], top_n: int = 8,
                boosts: dict[str, float] | None = None) -> list[str]:
    boosts = boosts or {}
    scored = sorted(((rank_model(m) + boosts.get(m["id"], 0.0), m["id"])
                     for m in models), reverse=True)
    return [mid for s, mid in scored[:top_n] if s > -50]


def experience_boost(memory: MemoryStore) -> dict[str, float]:
    """Learned intelligence: avg critic score per model (0-10) -> -5..+5.

    Erfahrung schlaegt Papier: models that consistently produced high
    scores climb the chain; weak ones sink - regardless of metadata.
    """
    totals: dict[str, list[int]] = {}
    for e in memory.events(kind="model_score", limit=200):
        p = e.get("payload", {})
        if p.get("model"):
            try:
                totals.setdefault(str(p["model"]), []).append(int(p.get("score", 5)))
            except (TypeError, ValueError):
                continue
    return {mid: round(max(-5.0, min(5.0, (sum(s) / len(s) - 5) * 1.0)), 2)
            for mid, s in totals.items()}


def format_models_report(models: list[dict[str, Any]], top_n: int = 8,
                         blacklisted: set[str] | None = None) -> str:
    """Human-readable view of the routing queue (for the CLI)."""
    blacklisted = blacklisted or set()
    scored = sorted(((rank_model(m), m) for m in models),
                    key=lambda p: -p[0])
    lines = [f"freie Modelle mit Tool-Support: {len(models)}",
             f"{'Nr':>3}  {'Score':>6}  {'Kontext':>11}  Modell"]
    for i, (score, m) in enumerate(scored[:top_n], 1):
        mid = str(m.get("id", "?"))
        ctx = int(m.get("context_length") or 0)
        flag = "  <- BLACKLIST (1h)" if mid in blacklisted else ""
        lines.append(f"{i:>3}  {score:>6.1f}  {ctx:>11,}  {mid}{flag}")
    rest = len(models) - min(top_n, len(models))
    if rest > 0:
        lines.append(f"(+{rest} weitere unterhalb der Kette)")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# Resilient executor                                                           #
# --------------------------------------------------------------------------- #
class ResilientLLM:
    """Tries the fallback chain in order; remembers dead models for an hour."""

    def __init__(self, cfg: Config, chain: list[str],
                 memory: MemoryStore | None = None, timeout: float = 45.0,
                 deadline_s: float = 300.0):
        self.cfg = cfg
        self.chain = [c for c in chain if c]
        self.memory = memory or MemoryStore(cfg.data_dir / "memory")
        self.timeout = timeout          # per-model cap (free models can hang)
        self.deadline_s = deadline_s    # whole-call budget across all models
        self.model_used: str | None = None
        self.failovers = 0
        if not self.chain:
            raise ValueError("empty routing chain")

    # -- health ------------------------------------------------------------ #
    def _recently_failed(self, model_id: str) -> bool:
        now = time.time()
        for e in self.memory.events(kind="model_fail", limit=40):
            p = e.get("payload", {})
            if p.get("model") == model_id and now - e.get("ts", 0) < COOLDOWN_S:
                return True
        return False

    def _record_fail(self, model_id: str, err: str) -> None:
        self.memory.add_event("model_fail", {
            "model": model_id, "error": str(err)[:160], "ts": time.time(),
        })

    def _record_success(self, model_id: str, latency_s: float) -> None:
        self.memory.add_event("model_ok", {
            "model": model_id, "latency_s": round(latency_s, 1),
        })

    # -- LLM protocol ------------------------------------------------------- #
    def complete(self, messages: list[Message], temperature: float = 0.3) -> LLMResponse:
        errors: list[str] = []
        started_all = time.time()
        for model_id in self._ordered_chain():
            if time.time() - started_all > self.deadline_s:
                break  # whole-call budget exhausted
            inner = self._endpoint_for(model_id)
            started = time.time()
            try:
                resp = inner.complete(messages, temperature=temperature)
                self.model_used = model_id
                self._record_success(model_id, time.time() - started)
                return resp
            except Exception as exc:  # noqa: BLE001 - any transport/model error
                errors.append(f"{model_id}: {type(exc).__name__}: {exc}"[:200])
                self._record_fail(model_id, exc)
                self.failovers += 1
        raise RuntimeError("all route candidates failed: " + " | ".join(errors[-3:]))

    def _endpoint_for(self, model_id: str) -> Any:
        """Single-model adapter (patch-friendly for tests)."""
        from .llm import OpenAICompatLLM
        return OpenAICompatLLM(self.cfg.api_key, self.cfg.base_url, model_id,
                               timeout=self.timeout)

    def _ordered_chain(self) -> list[str]:
        healthy = [m for m in self.chain if not self._recently_failed(m)]
        return healthy or self.chain  # last resort: retry blacklisted ones


class _endpoint:
    """Kept for backwards compatibility; ResilientLLM now uses _endpoint_for."""

    def __init__(self, cfg: Config, model_id: str, timeout: float):
        from .llm import OpenAICompatLLM
        self._inner = OpenAICompatLLM(cfg.api_key, cfg.base_url, model_id,
                                      timeout=timeout)

    def complete(self, messages: list[Message], temperature: float) -> LLMResponse:
        return self._inner.complete(messages, temperature=temperature)


# --------------------------------------------------------------------------- #
# Factory hook                                                                 #
# --------------------------------------------------------------------------- #
def auto_chain(cfg: Config, top_n: int = 8) -> list[str]:
    models = discover_free_tool_models(cfg.api_key, cfg.base_url)
    memory = MemoryStore(cfg.data_dir / "memory")
    return build_chain(models, top_n=top_n,
                       boosts=experience_boost(memory))
