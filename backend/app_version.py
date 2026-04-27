"""Single app version string (synced with repo VERSION, frontend package.json on merge to main)."""

from pathlib import Path


def _version_file() -> Path:
    return Path(__file__).resolve().parent / "VERSION"


def get_app_version() -> str:
    p = _version_file()
    if p.is_file():
        line = p.read_text(encoding="utf-8").strip().splitlines()
        if line:
            v = line[0].strip().lstrip("v")
            if v:
                return v
    return "0.0.0"
