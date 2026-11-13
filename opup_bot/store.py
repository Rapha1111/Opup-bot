"""Stockage d'un lien d'invitation unique par serveur (clé = ID du serveur)."""
import json
import os
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / "data" / "invites.json"


def _load() -> dict:
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def get_invite(guild_id: int) -> str | None:
    return _load().get(str(guild_id))


def set_invite(guild_id: int, url: str) -> None:
    data = _load()
    data[str(guild_id)] = url
    FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, FILE)
