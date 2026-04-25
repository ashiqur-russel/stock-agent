#!/usr/bin/env python3
"""
Require branch names to follow a simple prefix convention (e.g. feature/*, fix/*).

Skipped when in detached HEAD (rebase, etc.) so we do not block those flows.
"""

from __future__ import annotations

import re
import subprocess
import sys

# Exact names (integration / default branches)
_EXACT: frozenset[str] = frozenset(
    {
        "main",
        "master",
        "develop",
        "gh-pages",
    }
)

# require at least one character after the prefix+slash
_PREFIXES: tuple[str, ...] = (
    "feature/",
    "fix/",
    "hotfix/",
    "chore/",
    "docs/",
    "release/",
)

# Bots / automation (GitHub, etc.) — do not block
_AUTO_PREFIX = re.compile(
    r"^(dependabot|renovate|renovate-bot|copilot)/",
    re.IGNORECASE,
)


def _current_branch() -> str:
    r = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
    )
    r.check_returncode()
    return (r.stdout or "").strip()


def is_allowed(name: str) -> bool:
    if not name or name == "HEAD":
        return True  # detached HEAD: skip
    if name in _EXACT:
        return True
    if _AUTO_PREFIX.match(name):
        return True
    for p in _PREFIXES:
        if name.startswith(p) and len(name) > len(p):
            return True
    return False


def main() -> None:
    try:
        branch = _current_branch()
    except Exception as e:  # noqa: BLE001
        print(
            f"verify_branch_name: could not read git branch ({e}); skipping check.",
            file=sys.stderr,
        )
        return
    if branch == "HEAD":
        print(
            "verify_branch_name: detached HEAD — skip branch name check.",
            file=sys.stderr,
        )
        return
    if is_allowed(branch):
        return
    print(
        "Invalid branch name for this repository.\n"
        f"  Current: {branch!r}\n"
        "  Use one of:\n"
        f"    {', '.join(sorted(_EXACT))}\n"
        "    or a prefixed branch:\n"
        f"     {', '.join(p + '…' for p in _PREFIXES)}\n"
        "  (also allowed: dependabot/*, renovate/*, …)\n",
        file=sys.stderr,
    )
    raise SystemExit(1)


if __name__ == "__main__":
    main()
