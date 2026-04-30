"""Release notes for What's New (see releases.json)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_RELEASES_PATH = Path(__file__).resolve().parent.parent / "releases.json"
_releases_cache: dict[str, Any] | None = None


def _load_releases() -> dict[str, Any]:
    global _releases_cache
    if _releases_cache is not None:
        return _releases_cache
    if not _RELEASES_PATH.is_file():
        _releases_cache = {}
        return _releases_cache
    try:
        raw = json.loads(_RELEASES_PATH.read_text(encoding="utf-8"))
        _releases_cache = raw if isinstance(raw, dict) else {}
    except Exception:
        _releases_cache = {}
    return _releases_cache


def semver_tuple(v: str) -> tuple[int, int, int]:
    v = (v or "0").strip().lstrip("v")
    parts = v.split(".")
    out: list[int] = []
    for p in parts[:3]:
        num = "".join(c for c in p if c.isdigit())
        try:
            out.append(int(num) if num else 0)
        except ValueError:
            out.append(0)
    while len(out) < 3:
        out.append(0)
    return out[0], out[1], out[2]


def semver_gt(a: str, b: str | None) -> bool:
    """True if a is newer than b (b None or empty => True when a has notes)."""
    if not b:
        return True
    return semver_tuple(a) > semver_tuple(b)


def _pick_lang(val: Any, lang: str) -> Any:
    lang = (lang or "en").lower()[:2]
    if isinstance(val, dict) and ("en" in val or "de" in val):
        return val.get(lang) or val.get("en") or next(iter(val.values()), None)
    return val


def notes_for_version(version: str, lang: str = "en") -> dict[str, Any] | None:
    """Return { title, features, fixes } for exact version key, or None."""
    data = _load_releases().get(version)
    if not isinstance(data, dict):
        return None
    title = _pick_lang(data.get("title"), lang)
    features = _pick_lang(data.get("features"), lang)
    fixes = _pick_lang(data.get("fixes"), lang)
    if not isinstance(features, list):
        features = []
    if not isinstance(fixes, list):
        fixes = []
    if not isinstance(title, str):
        title = str(title or "")
    return {"title": title, "features": features, "fixes": fixes}


def preview_notes_for_version(version: str, lang: str = "en") -> dict[str, Any] | None:
    """Public teaser: truncated feature lines; omits full fixes list."""
    notes = notes_for_version(version, lang=lang)
    if not notes:
        return None

    def trunc_line(s: str, max_len: int = 96) -> str:
        s = (s or "").strip()
        if len(s) <= max_len:
            return s
        return s[: max_len - 1].rstrip() + "…"

    raw_features = notes.get("features") or []
    if not isinstance(raw_features, list):
        raw_features = []
    teaser_lines = [trunc_line(str(x)) for x in raw_features[:2]]
    raw_fixes = notes.get("fixes") or []
    n_fix = len(raw_fixes) if isinstance(raw_fixes, list) else 0
    n_feat = len(raw_features)
    has_more = n_feat > 2 or n_fix > 0
    return {
        "title": notes["title"],
        "features_teaser": teaser_lines,
        "has_more": has_more,
    }


def should_show_whats_new(
    app_version: str,
    cleared_version: str | None,
    read_version: str | None,
) -> bool:
    """
    Show What's New when this version has notes and the user has not cleared it yet.

    * Done / Suppress: cleared_version is set to current → hidden until app_version increases.
    * Later (no API): cleared_version unchanged → keeps showing on each visit until they act.
    """
    _ = read_version  # reserved for future (e.g. badge); cleared drives visibility
    if not notes_for_version(app_version):
        return False
    return semver_gt(app_version, cleared_version)
