#!/usr/bin/env python3
"""
Require branch names: topic branches use a prefix (feature/, fix/, …) and must
include a ticket id right after the prefix: SA-<digits>, e.g. feature/SA-4-user-prefs.

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

# After e.g. "feature/", the rest must start with SA-<ticket> (e.g. SA-4, SA-12)
_SA_PREFIX = re.compile(r"^SA-\d+(-[a-zA-Z0-9._/-]+)*$")


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
        if not (name.startswith(p) and len(name) > len(p)):
            continue
        rest = name[len(p) :]
        if _SA_PREFIX.match(rest):
            return True
        return False
    return False


def _topic_prefix_and_rest(name: str) -> tuple[str, str] | None:
    """If name uses a topic prefix, return (prefix, rest); else None."""
    for p in _PREFIXES:
        if name.startswith(p) and len(name) > len(p):
            return (p, name[len(p) :])
    return None


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
            "  Create a topic branch and open a pull request, for example:\n"
            "    git checkout -b feature/SA-1-short-description\n"
            "    # also: fix/SA-2-…, hotfix/SA-3-…, chore/SA-4-…\n"
            "  (Ticket id is SA-<number> right after the prefix.)\n"
            "  Merges on GitHub are fine; a local `git merge` on main is blocked by this hook.\n"
            "  Rare exception:  git commit --no-verify  (e.g. emergency merge on main)\n",
            file=sys.stderr,
        )
        raise SystemExit(1)
    bad_topic = _topic_prefix_and_rest(branch)
    if bad_topic is not None and not _SA_PREFIX.match(bad_topic[1]):
        p, rest = bad_topic
        print(
            "Branch name must include a ticket id immediately after the prefix: SA-<number>.\n"
            f"  Current: {branch!r}\n"
            f"  After {p!r} the name must look like: SA-12 or SA-12-my-slug (not: {rest!r})\n"
            "  Example:  feature/SA-4-live-quotes,  fix/SA-5-branch-guard,  hotfix/SA-1-patch\n",
            file=sys.stderr,
        )
        raise SystemExit(1)
    print(
        "Invalid branch name for this repository.\n"
        f"  Current: {branch!r}\n"
        "  Use one of:\n"
        f"    {', '.join(sorted(_EXACT))}\n"
        "    or a topic branch:  <prefix>SA-<number>[-description]\n"
        f"     prefixes: {', '.join(_PREFIXES)}\n"
        "  (also allowed: dependabot/*, renovate/*, …)\n",
        file=sys.stderr,
    )
    raise SystemExit(1)


if __name__ == "__main__":
    main()
