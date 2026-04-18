from __future__ import annotations

import torch
import torch.nn as nn

from .constants import EXERCISE_DIMS, METRIC_DIMS


class RecommenderCNN(nn.Module):
    """Score (user_history, exercise) → predicted improvement delta.

    Stream 1 — history  : [B, METRIC_DIMS, N_HISTORY] → Conv1d → 64-dim user embedding
    Stream 2 — exercise : [B, EXERCISE_DIMS]           → Linear → 64-dim exercise embedding
    Head                : [B, 128] → [B, 1] improvement score

    Trained per-user. Cold-start (untrained) outputs near-zero, so the
    ε-greedy blender falls back to the deterministic heuristic until enough
    data accumulates.
    """

    def __init__(self) -> None:
        super().__init__()

        self.history_conv = nn.Sequential(
            nn.Conv1d(METRIC_DIMS, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),           # → [B, 64]
        )

        self.exercise_embed = nn.Sequential(
            nn.Linear(EXERCISE_DIMS, 64),
            nn.ReLU(),
        )

        self.head = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def forward(
        self,
        history: torch.Tensor,   # [B, METRIC_DIMS, N_HISTORY]
        exercise: torch.Tensor,  # [B, EXERCISE_DIMS]
    ) -> torch.Tensor:           # [B, 1]
        h = self.history_conv(history)
        e = self.exercise_embed(exercise)
        return self.head(torch.cat([h, e], dim=1))
