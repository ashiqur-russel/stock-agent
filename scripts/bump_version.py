#!/usr/bin/env python3
"""Increment patch version: repo VERSION, backend/VERSION, frontend/package.json, frontend/package-lock.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def bump_patch(v: str) -> str:
    parts = v.strip().lstrip("v").split(".")
    while len(parts) < 3:
        parts.append("0")
    major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
    return f"{major}.{minor}.{patch + 1}"


def main() -> None:
    version_file = ROOT / "VERSION"
    if not version_file.is_file():
        print("VERSION file missing", file=sys.stderr)
        sys.exit(1)
    line = version_file.read_text(encoding="utf-8").strip().splitlines()
    v = line[0].strip() if line else ""
    if not v:
        print("VERSION empty", file=sys.stderr)
        sys.exit(1)
    nv = bump_patch(v)

    for p in (version_file, ROOT / "backend" / "VERSION"):
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(nv + "\n", encoding="utf-8")

    pkg_path = ROOT / "frontend" / "package.json"
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    pkg["version"] = nv
    pkg_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")

    lock_path = ROOT / "frontend" / "package-lock.json"
    if lock_path.is_file():
        lock = json.loads(lock_path.read_text(encoding="utf-8"))
        lock["version"] = nv
        if isinstance(lock.get("packages"), dict) and "" in lock["packages"]:
            lock["packages"][""]["version"] = nv
        lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")

    print(f"Bumped {v} -> {nv}")


if __name__ == "__main__":
    main()
