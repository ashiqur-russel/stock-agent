#!/usr/bin/env python3
"""
Block `git push` that updates protected integration branches from your machine
(main / master / development).

Protected: main, master, development, develop — use a topic branch + PR into **development**
(feature/fix work) or follow maintainer process for **main**.

GitHub merge buttons do not go through this hook. Bypass: ALLOW_PUSH_PROTECTED=1
(legacy: ALLOW_PUSH_TO_MAIN=1 still works).
"""

from __future__ import annotations

import os
import sys

# Remote refs you must not update via direct `git push` from a laptop.
# Merge via GitHub PR into **development** (or maintainer release merge to **main**).
_PROTECTED = frozenset(
    {
        "refs/heads/main",
        "refs/heads/master",
        "refs/heads/development",
        "refs/heads/develop",
    }
)


def main() -> None:
    bypass = os.environ.get("ALLOW_PUSH_PROTECTED", "").strip() in ("1", "true", "yes") or os.environ.get(
        "ALLOW_PUSH_TO_MAIN", ""
    ).strip() in ("1", "true", "yes")
    if bypass:
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
                "Pushing directly to a protected branch (main / master / development) is not allowed from this hook.\n"
                f"  Blocked: {remote_ref}\n"
                "  Use a topic branch and open a pull request into **development** "
                "(feature/fix PRs must not target **main**).\n"
                "  Emergency bypass: ALLOW_PUSH_PROTECTED=1 git push  (legacy: ALLOW_PUSH_TO_MAIN=1)\n",
                file=sys.stderr,
            )
            raise SystemExit(1)


if __name__ == "__main__":
    main()
