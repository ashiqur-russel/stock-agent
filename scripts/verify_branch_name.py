#!/usr/bin/env python3
"""
Require branch names: topic branches use a prefix (feature/, fix/, …) and must
include a ticket id right after the prefix: SA-<digits>, e.g. feature/SA-4-user-prefs.

Skipped when in detached HEAD (rebase, etc.) so we do not block those flows.
"""

from __future__ import annotations

import os
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
_SA_PREFIX = re.compile(r"^SA-\d+(-[a-zA-Z0-9._-]+)*$")


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


def _ticket_num_from_topic(name: str) -> int | None:
    """If name is a valid topic branch with SA-<n>, return n; else None."""
    topic = _topic_prefix_and_rest(name)
    if topic is None:
        return None
    _, rest = topic
    if not _SA_PREFIX.match(rest):
        return None
    m = re.match(r"^SA-(\d+)", rest)
    if m:
        return int(m.group(1))
    return None


def _git_remotes() -> set[str]:
    r = subprocess.run(
        ["git", "remote"],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return {"origin"}
    return {x.strip() for x in (r.stdout or "").splitlines() if x.strip()}


def _logical_branch_names(include_remotes: bool = False) -> set[str]:
    """
    Local branch short names (refs/heads/).

    When *include_remotes* is True, remote-tracking refs (refs/remotes/) are
    also included, normalised by stripping the leading remote name so that
    "origin/fix/SA-1-foo" becomes "fix/SA-1-foo".
    """
    refs = ["refs/heads/"]
    if include_remotes:
        refs.append("refs/remotes/")
    r = subprocess.run(
        ["git", "for-each-ref", "--format=%(refname:short)"] + refs,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return set()
    rem = _git_remotes() if include_remotes else set()
    out: set[str] = set()
    for line in (r.stdout or "").splitlines():
        s = line.strip()
        if not s or s in ("HEAD",) or s.endswith("/HEAD"):
            continue
        if include_remotes:
            parts = s.split("/")
            if len(parts) >= 2 and parts[0] in rem:
                s = "/".join(parts[1:])
            if s in ("HEAD",) or s.endswith("/HEAD"):
                continue
        out.add(s)
    return out


def _check_sa_ticket_unique(current: str) -> None:
    """
    Require that SA-<n> is not used by another (different) branch in this clone.

    By default only local branches (refs/heads/) are scanned for speed.
    Set the environment variable BRANCH_CHECK_REMOTES=1 to also scan all
    remote-tracking refs (refs/remotes/) — useful in CI or after a fetch.
    """
    n = _ticket_num_from_topic(current)
    if n is None:
        return
    include_remotes = os.environ.get("BRANCH_CHECK_REMOTES", "").strip() == "1"
    names = _logical_branch_names(include_remotes=include_remotes)
    others: list[str] = []
    for b in names:
        if b == current:
            continue
        bn = _ticket_num_from_topic(b)
        if bn is not None and bn == n:
            others.append(b)
    if not others:
        return
    olist = "\n  ".join(sorted(set(others)))
    print(
        f"The ticket id SA-{n} is already used on another branch in this repository.\n"
        f"  Your branch: {current!r}\n"
        f"  Also using SA-{n}:\n  {olist}\n"
        "  Use a new ticket id that does not match any of the above, e.g. create on GitHub\n"
        f"  and name the branch: feature/SA-<new>-short-desc (or fix/…, hotfix/…). Or delete the\n"
        f"  other ref(s) after merging (git branch -d, git push origin --delete …), then prune\n"
        f"  (git fetch --prune). Rare bypass: SKIP=branch-name git commit\n",
        file=sys.stderr,
    )
    raise SystemExit(1)


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
    if is_allowed(branch):
        _check_sa_ticket_unique(branch)
        return
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
