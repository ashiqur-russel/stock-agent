#!/usr/bin/env python3
"""
Commit message + pre-push validation for Stock Agent.

- Normal commits: first line must match  [SA-<digits>] <word>...
- Exempt: Merge, Revert, fixup!, squash!

Usage:
  python3 scripts/sa_commit_message.py <path-to-COMMIT_EDITMSG>   # commit-msg hook
  python3 scripts/sa_commit_message.py --pre-push                   # pre-push hook (reads git stdin)
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

_STRICT = re.compile(r"^\[SA-(\d+)\]\s+(\S+.*)$")


def is_valid_first_line(line: str) -> bool:
    s = (line or "").strip()
    if not s:
        return False
    if s.startswith("Merge "):
        return True
    if s.startswith("Revert "):
        return True
    if s.startswith("fixup! ") or s.startswith("squash! "):
        return True
    return _STRICT.match(s) is not None


def explain_failure() -> str:
    return (
        "Invalid commit subject (first line).\n"
        "  Use:  [SA-<number>] <type>: <summary>\n"
        "  Example:  [SA-4] feat: add CI\n"
        "  Exempt:  Merge, Revert, fixup!, squash!\n"
    )


def validate_message_text(text: str) -> None:
    first = text.splitlines()[0] if text else ""
    if is_valid_first_line(first):
        return
    print(
        f"{explain_failure()}\n  Got first line: {first!r}\n",
        file=sys.stderr,
    )
    raise SystemExit(1)


def _subjects_in_push_range(remote_sha: str, local_sha: str) -> list[str]:
    """List one-line subject for each new commit in the push (oldest first)."""
    if not remote_sha or (len(remote_sha) == 40 and set(remote_sha) == {"0"}):
        r = subprocess.run(
            [
                "git",
                "rev-list",
                "--first-parent",
                f"{local_sha}",
                "--not",
                "--all",
            ],
            capture_output=True,
            text=True,
        )
    else:
        r = subprocess.run(
            ["git", "rev-list", "--first-parent", f"{remote_sha}..{local_sha}"],
            capture_output=True,
            text=True,
        )
    r.check_returncode()
    hashes = [h for h in r.stdout.splitlines() if h.strip()]
    # Oldest first for friendlier error messages
    hashes.reverse()
    out: list[str] = []
    for h in hashes:
        s = subprocess.run(
            ["git", "log", "-1", "--format=%s", h],
            capture_output=True,
            text=True,
        )
        s.check_returncode()
        line = s.stdout.splitlines()[0] if s.stdout.strip() else ""
        out.append(line)
    return out


def pre_push() -> None:
    """Validate every commit in refs reported by `git` on stdin (pre-push hook)."""
    lines = [ln.strip() for ln in sys.stdin if ln.strip()]
    failed: list[str] = []
    for line in lines:
        parts = line.split()
        if len(parts) != 4:
            continue
        _local_ref, local_sha, _remote_ref, remote_sha = parts
        for subject in _subjects_in_push_range(remote_sha, local_sha):
            if is_valid_first_line(subject):
                continue
            failed.append(subject)
    if not failed:
        return
    print(
        f"{explain_failure()}\nOffending subject line(s) in this push:\n"
        + "\n".join(f"  - {s!r}" for s in failed)
        + "\n",
        file=sys.stderr,
    )
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] == "--pre-push":
        pre_push()
        return
    if len(sys.argv) >= 2:
        p = Path(sys.argv[1])
        validate_message_text(p.read_text(encoding="utf-8", errors="replace"))
        return
    print("usage: sa_commit_message.py <COMMIT_MSG_FILE> | --pre-push", file=sys.stderr)
    raise SystemExit(2)


if __name__ == "__main__":
    main()
