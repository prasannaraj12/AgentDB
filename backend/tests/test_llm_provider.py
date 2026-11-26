import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agent import resolve_provider, build_llm, DEFAULT_MODELS

ENV_VARS = ("LLM_PROVIDER", "GROQ_API_KEY", "GEMINI_API_KEY", "GROQ_MODEL", "GEMINI_MODEL")


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for var in ENV_VARS:
        monkeypatch.delenv(var, raising=False)


def test_no_keys_raises_clear_error():
    with pytest.raises(RuntimeError, match="GROQ_API_KEY or GEMINI_API_KEY"):
        resolve_provider()


def test_groq_key_auto_selects_groq(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    assert resolve_provider() == "groq"


def test_gemini_key_auto_selects_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    assert resolve_provider() == "gemini"


def test_groq_preferred_when_both_keys_present(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "a")
    monkeypatch.setenv("GEMINI_API_KEY", "b")
    assert resolve_provider() == "groq"


def test_explicit_provider_overrides_auto(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "a")
    monkeypatch.setenv("GEMINI_API_KEY", "b")
    monkeypatch.setenv("LLM_PROVIDER", "Gemini")
    assert resolve_provider() == "gemini"


def test_unsupported_provider_rejected(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    with pytest.raises(ValueError, match="Unsupported LLM_PROVIDER"):
        resolve_provider()


def test_explicit_provider_without_key_raises(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GEMINI_API_KEY", "b")
    with pytest.raises(RuntimeError, match="GROQ_API_KEY is not set"):
        build_llm()


def test_build_groq_llm_default_model(monkeypatch):
    from langchain_groq import ChatGroq
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    llm = build_llm()
    assert isinstance(llm, ChatGroq)
    assert llm.model_name == DEFAULT_MODELS["groq"]
    # ChatGroq maps 0 to 1e-8 because Groq's API rejects exactly 0.
    assert llm.temperature < 1e-6


def test_build_groq_llm_model_override(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    assert build_llm().model_name == "qwen/qwen3.8-27b"


def test_build_gemini_llm(monkeypatch):
    from langchain_google_genai import ChatGoogleGenerativeAI
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    llm = build_llm()
    assert isinstance(llm, ChatGoogleGenerativeAI)
    assert DEFAULT_MODELS["gemini"] in llm.model
