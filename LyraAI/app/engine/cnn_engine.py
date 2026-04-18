from __future__ import annotations

import threading
from pathlib import Path

import torch

from .cnn_model import RecommenderCNN
from .feature_builder import build_exercise_tensor, build_history_tensor


class CNNEngine:
    """Per-user inference wrapper for RecommenderCNN.

    Thread-safe: uses a lock around model reloads so the training thread
    can swap weights without racing inference calls.
    """

    def __init__(self, weights_path: Path) -> None:
        self._weights_path = weights_path
        self._model: RecommenderCNN | None = None
        self._lock = threading.Lock()
        self._load_if_exists()

    # ------------------------------------------------------------------
    # Public

    @property
    def is_ready(self) -> bool:
        return self._model is not None

    def reload(self) -> None:
        self._load_if_exists()

    def score_exercises(
        self,
        metric_history: list[dict],
        exercises: list[dict],
    ) -> list[float]:
        """Return one improvement score per exercise.

        exercises: list of dicts with 'difficulty' (int) and 'target_skills' (JSON str).
        Returns scores in the same order; higher is better.
        Returns [0.0] * len(exercises) if model is not ready.
        """
        if not self.is_ready or not exercises:
            return [0.0] * len(exercises)

        history_t = build_history_tensor(metric_history)
        exercise_ts = torch.stack([
            build_exercise_tensor(ex["difficulty"], ex.get("target_skills", "[]"))
            for ex in exercises
        ])   # [N, EXERCISE_DIMS]

        n = len(exercises)
        history_batch = history_t.expand(n, -1, -1)   # [N, METRIC_DIMS, N_HISTORY]

        with self._lock:
            self._model.eval()
            with torch.no_grad():
                scores = self._model(history_batch, exercise_ts)   # [N, 1]

        return scores.squeeze(1).tolist()

    # ------------------------------------------------------------------
    # Private

    def _load_if_exists(self) -> None:
        if not self._weights_path.exists():
            return
        model = RecommenderCNN()
        try:
            state = torch.load(str(self._weights_path), map_location="cpu")
            model.load_state_dict(state)
        except Exception:
            return
        with self._lock:
            self._model = model
