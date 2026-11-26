"""Turn LLM provider exceptions into messages that are safe and useful to show users.

Raw provider errors can include organization IDs, billing links and request
details, so they are logged server-side and replaced with a plain explanation.
"""
import re
from typing import Optional


def _status_code(exc: BaseException) -> Optional[int]:
    for attr in ("status_code", "code", "http_status"):
        value = getattr(exc, attr, None)
        if isinstance(value, int):
            return value
    response = getattr(exc, "response", None)
    value = getattr(response, "status_code", None)
    return value if isinstance(value, int) else None


def _retry_after_seconds(text: str) -> Optional[int]:
    """Parse hints like 'try again in 457.5ms', 'in 12.3s' or 'in 1m5.2s'."""
    match = re.search(r"try again in\s+(?:(\d+)m)?\s*([\d.]+)\s*(ms|s)\b", text, re.IGNORECASE)
    if not match:
        return None
    minutes = int(match.group(1) or 0)
    value = float(match.group(2))
    seconds = value / 1000 if match.group(3).lower() == "ms" else value
    return max(1, int(round(minutes * 60 + seconds + 0.5)))


def is_rate_limit_error(exc: BaseException) -> bool:
    if _status_code(exc) == 429:
        return True
    name = type(exc).__name__
    if name in ("RateLimitError", "ResourceExhausted"):
        return True
    text = str(exc).lower()
    return "rate limit" in text or "rate_limit" in text or "resource_exhausted" in text


def user_facing_error(exc: BaseException) -> str:
    """Map an exception from the agent run to a message for the chat UI."""
    text = str(exc)
    status = _status_code(exc)

    if is_rate_limit_error(exc):
        wait = _retry_after_seconds(text)
        when = f"in about {wait} second{'s' if wait != 1 else ''}" if wait else "in a few seconds"
        return ("The AI model is getting too many requests right now (the provider's rate limit "
                f"was reached). Please try again {when}.")
    if status == 401 or "invalid api key" in text.lower() or "api key not valid" in text.lower():
        return "The AI provider rejected the API key. Check the key in backend/.env and restart the backend."
    if status == 404 and "model" in text.lower():
        return ("The configured AI model is not available to this API key. "
                "Set GROQ_MODEL (or GEMINI_MODEL) in backend/.env to a model your key can use.")
    if isinstance(exc, (RuntimeError, ValueError)) and ("LLM_PROVIDER" in text or "API key" in text or "API_KEY" in text):
        return text  # our own configuration errors from agent.resolve_provider/build_llm
    return "Something went wrong while answering that question. Please try again."
