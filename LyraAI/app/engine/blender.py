from __future__ import annotations

import random


class EngineBlender:
    """ε-greedy blend of deterministic heuristic and CNN recommender.

    epsilon = max(0.05, 1.0 / (1.0 + n_sessions * 0.1))

    At session 0: epsilon=1.0  → always use heuristic (explore).
    At session 100: epsilon≈0.09 → ~91% CNN (exploit).
    Asymptote at 0.05 → 5% permanent exploration.
    """

    def __init__(self, n_sessions: int = 0) -> None:
        self._n_sessions = n_sessions

    @property
    def n_sessions(self) -> int:
        return self._n_sessions

    @property
    def epsilon(self) -> float:
        return max(0.05, 1.0 / (1.0 + self._n_sessions * 0.1))

    def increment(self) -> None:
        self._n_sessions += 1

    def should_use_cnn(self, cnn_ready: bool) -> bool:
        return cnn_ready and random.random() >= self.epsilon

    def rank_exercises(
        self,
        exercises: list[dict],
        scores: list[float],
        use_cnn: bool,
    ) -> list[dict]:
        """Return exercises sorted by score (descending) if using CNN, else by difficulty."""
        if use_cnn and scores:
            paired = sorted(zip(scores, exercises), key=lambda p: p[0], reverse=True)
            ranked = [ex for _, ex in paired]
        else:
            ranked = sorted(exercises, key=lambda ex: ex.get("difficulty", 5))

        for ex in ranked:
            ex["selected_by"] = "cnn" if use_cnn else "deterministic"

        return ranked
