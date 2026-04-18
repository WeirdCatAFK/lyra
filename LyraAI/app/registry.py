from __future__ import annotations

import os
import threading
from pathlib import Path

from .engine.cnn_engine import CNNEngine

_DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
_engines: dict[str, CNNEngine] = {}
_lock = threading.Lock()


def get_engine(user_id: str) -> CNNEngine:
    """Return (or lazily create) the per-user CNNEngine."""
    with _lock:
        if user_id not in _engines:
            weights_path = _DATA_DIR / "weights" / f"{user_id}.pt"
            _engines[user_id] = CNNEngine(weights_path)
        return _engines[user_id]
