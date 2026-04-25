#!/usr/bin/env python3
"""
Block `git push` that updates the remote's default branch (main / master) from your machine.

Use a topic branch + PR instead: feature/..., fix/..., hotfix/..., etc.

GitHub merges do not go through this hook. Bypass: ALLOW_PUSH_TO_MAIN=1
"""

from __future__ import annotations

import os
import sys

# Branches you must not update via direct `git push origin <branch>`.
# Use pull requests to merge into these.
_PROTECTED = frozenset(
    {
        "refs/heads/main",
        "refs/heads/master",
    }
)


def main() -> None:
    if os.environ.get("ALLOW_PUSH_TO_MAIN", "").strip() in ("1", "true", "yes"):
        return
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) != 4:
            continue
        _lr, _ls, remote_ref, _rs = parts
        if remote_ref in _PROTECTED:
            print(
                "Pushing directly to the remote's main branch is not allowed from this hook.\n"
                f"  Blocked: {remote_ref}\n"
                "  Use a topic branch and open a pull request (e.g. feature/..., fix/..., hotfix/...).\n"
                "  Emergency bypass: ALLOW_PUSH_TO_MAIN=1 git push\n",
                file=sys.stderr,
            )
            raise SystemExit(1)


if __name__ == "__main__":
    main()
