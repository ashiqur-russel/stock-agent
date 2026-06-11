"""Tests for the in-memory sliding-window rate limiter."""

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import config
from middleware.rate_limit import RateLimiter


def _request(ip: str = "1.2.3.4", forwarded: str | None = None):
    headers = {"x-forwarded-for": forwarded} if forwarded else {}
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=ip))


class TestRateLimiter:
    def test_allows_up_to_limit(self):
        limiter = RateLimiter(3, minutes=1)
        for _ in range(3):
            limiter(_request())

    def test_blocks_over_limit_with_retry_after(self):
        limiter = RateLimiter(2, minutes=1)
        limiter(_request())
        limiter(_request())
        with pytest.raises(HTTPException) as exc:
            limiter(_request())
        assert exc.value.status_code == 429
        assert int(exc.value.headers["Retry-After"]) >= 1

    def test_buckets_are_per_ip(self):
        limiter = RateLimiter(1, minutes=1)
        limiter(_request(ip="1.1.1.1"))
        limiter(_request(ip="2.2.2.2"))  # different client — own bucket

    def test_uses_first_forwarded_hop_behind_proxy(self):
        limiter = RateLimiter(1, minutes=1)
        limiter(_request(ip="10.0.0.1", forwarded="9.9.9.9, 10.0.0.1"))
        with pytest.raises(HTTPException):
            limiter(_request(ip="10.0.0.2", forwarded="9.9.9.9, 10.0.0.2"))

    def test_kill_switch_disables_limiting(self, monkeypatch):
        monkeypatch.setattr(config, "RATE_LIMIT_ENABLED", False)
        limiter = RateLimiter(1, minutes=1)
        for _ in range(10):
            limiter(_request())

    def test_window_expiry_frees_budget(self, monkeypatch):
        import middleware.rate_limit as rl

        now = {"t": 1000.0}
        monkeypatch.setattr(rl.time, "monotonic", lambda: now["t"])
        limiter = RateLimiter(1, seconds=10)
        limiter(_request())
        with pytest.raises(HTTPException):
            limiter(_request())
        now["t"] += 11  # window passed — budget restored
        limiter(_request())
