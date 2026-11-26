import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from llm_errors import user_facing_error, is_rate_limit_error

GROQ_429_TEXT = ("Error code: 429 - {'error': {'message': 'Rate limit reached for model `openai/gpt-oss-120b` "
                 "in organization `org_secret123` service tier `on_demand` on tokens per minute (TPM): "
                 "Limit 8000, Used 5743, Requested 2318. Please try again in 457.5ms. Need more tokens? "
                 "Upgrade to Dev Tier today at https://console.groq.com/settings/billing', "
                 "'type': 'tokens', 'code': 'rate_limit_exceeded'}}")


class FakeHTTPError(Exception):
    def __init__(self, message, status_code):
        super().__init__(message)
        self.status_code = status_code


class RateLimitError(Exception):
    pass


def test_groq_rate_limit_is_friendly_and_hides_org_details():
    msg = user_facing_error(FakeHTTPError(GROQ_429_TEXT, 429))
    assert "rate limit" in msg.lower()
    assert "try again in about 1 second" in msg
    assert "org_secret123" not in msg and "billing" not in msg


def test_rate_limit_wait_in_seconds():
    msg = user_facing_error(FakeHTTPError("Please try again in 12.3s.", 429))
    assert "about 13 seconds" in msg


def test_rate_limit_wait_in_minutes_and_seconds():
    msg = user_facing_error(FakeHTTPError("Please try again in 1m5.2s.", 429))
    assert "about 66 seconds" in msg


def test_rate_limit_detected_by_class_name_without_status():
    assert is_rate_limit_error(RateLimitError("slow down"))
    assert "in a few seconds" in user_facing_error(RateLimitError("slow down"))


def test_invalid_key_message():
    msg = user_facing_error(FakeHTTPError("Invalid API Key", 401))
    assert "rejected the API key" in msg


def test_model_not_found_message():
    msg = user_facing_error(FakeHTTPError("The model `x` does not exist", 404))
    assert "GROQ_MODEL" in msg


def test_own_config_errors_are_shown():
    err = RuntimeError("No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in backend/.env.")
    assert user_facing_error(err) == str(err)


def test_unknown_errors_are_generic():
    msg = user_facing_error(KeyError("internal detail /path/secret"))
    assert "secret" not in msg
    assert "try again" in msg.lower()
