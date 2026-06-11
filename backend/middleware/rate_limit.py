"""Lightweight in-memory rate limiting for FastAPI routes.

Single-process sliding window — fits the current one-instance deployment
(uvicorn on Render). For multi-instance deployments, swap the backing store
for Redis; the dependency interface can stay the same.

Usage:
    @router.post("/login", dependencies=[Depends(RateLimiter(5, minutes=15))])
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

import config

# Prune idle client entries once the registry grows past this many keys.
_PRUNE_THRESHOLD = 10_000


def _client_ip(request: Request) -> str:
    # Behind Render/Vercel the real client is the first hop in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimiter:
    def __init__(self, limit: int, *, seconds: int = 0, minutes: int = 0, hours: int = 0):
        window = seconds + minutes * 60 + hours * 3600
        if limit <= 0 or window <= 0:
            raise ValueError("Rate limit and window must be positive")
        self.limit = limit
        self.window = window
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def __call__(self, request: Request) -> None:
        if not config.RATE_LIMIT_ENABLED:
            return
        now = time.monotonic()
        key = _client_ip(request)
        with self._lock:
            hits = self._hits[key]
            cutoff = now - self.window
            while hits and hits[0] < cutoff:
                hits.popleft()
            if len(hits) >= self.limit:
                retry_after = max(1, int(hits[0] - cutoff) + 1)
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many requests — please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)
            if len(self._hits) > _PRUNE_THRESHOLD:
                self._prune(cutoff)

    def _prune(self, cutoff: float) -> None:
        stale = [k for k, v in self._hits.items() if not v or v[-1] < cutoff]
        for k in stale:
            del self._hits[k]
