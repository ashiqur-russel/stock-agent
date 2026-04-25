#!/usr/bin/env python3
"""
Require branch names to follow a simple prefix convention (e.g. feature/*, fix/*).

Skipped when in detached HEAD (rebase, etc.) so we do not block those flows.
"""

from __future__ import annotations

import re
import subprocess
import sys

# Exact names where commits are still allowed. Do NOT list main/master — you must
# use a topic branch (feature/…, fix/…) and merge via PR. (GitHub merges and PR
# checks do not use this local hook.)
_EXACT: frozenset[str] = frozenset(
    {
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
    if branch in ("main", "master"):
        print(
            "Do not make commits while checked out on the default branch (main or master).\n"
            f"  Current branch: {branch!r}\n"
            "  Create a topic branch, commit there, and open a pull request:\n"
            "    git checkout -b feature/SA-1-my-change\n"
            "    # or: fix/..., hotfix/..., chore/...\n"
            "  Merging into main on GitHub is fine; a local `git merge` on main is blocked\n"
            "  by this hook — use the GitHub PR flow, or once:  git commit --no-verify  (rare)\n",
            file=sys.stderr,
        )
        raise SystemExit(1)
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
