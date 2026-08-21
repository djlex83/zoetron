"""Tests for the AUTOROUTER (model mortality immune system)."""
from pathlib import Path

import pytest

from zoetron.config import Config
from zoetron.llm import LLMResponse, Message, MockLLM
from zoetron.memory import MemoryStore
from zoetron.router import (ResilientLLM, _BANNED, build_chain, rank_model)


# --------------------------------------------------------------------------- #
# ranking / hard rule                                                          #
# --------------------------------------------------------------------------- #
def _model(mid: str, ctx: int = 200_000) -> dict:
    return {"id": mid, "context_length": ctx,
            "supported_parameters": ["tools"]}


def test_hard_rule_bans_non_chat_models():
    assert rank_model(_model("nvidia/x-content-safety:free")) == -100.0
    assert rank_model(_model("google/lyria-3-pro-preview")) == -100.0
    assert "safety" in _BANNED.pattern


def test_ranking_prefers_big_ultra_models():
    small = rank_model(_model("nvidia/nemotron-nano-9b-v2:free", ctx=128_000))
    huge = rank_model(_model("nvidia/nemotron-3-ultra-550b-a55b:free",
                             ctx=1_000_000))
    assert huge > small + 5


def test_build_chain_drops_banned_and_orders_by_score():
    models = [
        _model("nvidia/nemotron-3-ultra-550b-a55b:free", 1_000_000),
        _model("x/safety:free"),
        _model("openai/gpt-oss-20b:free", 131_072),
    ]
    chain = build_chain(models, top_n=3)
    assert chain[0] == "nvidia/nemotron-3-ultra-550b-a55b:free"
    assert "x/safety:free" not in chain
    assert chain[-1] == "openai/gpt-oss-20b:free"


# --------------------------------------------------------------------------- #
# failover                                                                     #
# --------------------------------------------------------------------------- #
class _Flaky:
    def __init__(self, fail: bool):
        self.fail = fail

    def complete(self, messages, temperature=0.3):
        if self.fail:
            raise RuntimeError("model exploded")
        return LLMResponse(text="ok", model="fake")


def test_failover_skips_dead_model_and_remembers(tmp_path):
    cfg = Config(data_dir=tmp_path)
    llm = ResilientLLM(cfg, ["dead/model", "alive/model"],
                       memory=MemoryStore(tmp_path / "memory"), timeout=5)
    endpoints = {"dead/model": _Flaky(fail=True),
                 "alive/model": _Flaky(fail=False)}
    llm._endpoint_for = lambda mid: endpoints[mid]

    resp = llm.complete([Message("user", "hi")])
    assert resp.text == "ok"
    assert llm.model_used == "alive/model"
    assert llm.failovers == 1
    # dead model is now blacklisted in memory -> second call goes straight
    resp2 = llm.complete([Message("user", "hi again")])
    assert llm.model_used == "alive/model"
    assert llm.failovers == 1  # no new failover: blacklist worked
    fails = MemoryStore(tmp_path / "memory").events(kind="model_fail")
    assert len(fails) == 1


def test_all_dead_raises(tmp_path):
    cfg = Config(data_dir=tmp_path)
    llm = ResilientLLM(cfg, ["dead/a", "dead/b"],
                       memory=MemoryStore(tmp_path / "memory"), timeout=5)
    llm._endpoint_for = lambda mid: _Flaky(fail=True)
    with pytest.raises(RuntimeError, match="all route candidates failed"):
        llm.complete([Message("user", "hi")])


def test_empty_chain_rejected(tmp_path):
    with pytest.raises(ValueError):
        ResilientLLM(Config(data_dir=tmp_path), [],
                     memory=MemoryStore(tmp_path / "memory"))


def test_mock_still_works_for_offline(tmp_path):
    from zoetron.llm import make_llm
    cfg = Config(data_dir=tmp_path)
    llm, offline = make_llm(cfg)
    assert offline and isinstance(llm, MockLLM)
