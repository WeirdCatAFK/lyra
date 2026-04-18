from __future__ import annotations

import json

import torch

from .constants import EXERCISE_DIMS, METRIC_DIMS, METRIC_NAMES, N_HISTORY, SKILL_TAGS


def build_history_tensor(metric_rows: list[dict]) -> torch.Tensor:
    """Build [1, METRIC_DIMS, N_HISTORY] from last N completed session vectors.

    metric_rows: list of metric_vector dicts, ordered oldest → newest.
    Rows beyond N_HISTORY are truncated from the front; shorter sequences
    are zero-padded at the front (oldest slots).
    """
    data = torch.zeros(METRIC_DIMS, N_HISTORY, dtype=torch.float32)
    rows = metric_rows[-N_HISTORY:]
    offset = N_HISTORY - len(rows)
    for t, row in enumerate(rows):
        for i, name in enumerate(METRIC_NAMES):
            data[i, offset + t] = float(row.get(name, 0.0))
    return data.unsqueeze(0)   # [1, METRIC_DIMS, N_HISTORY]


def build_exercise_tensor(difficulty: int, target_skills_json: str) -> torch.Tensor:
    """Build [EXERCISE_DIMS] feature vector for one exercise.

    Layout: [difficulty_norm, skill_tag_0, ..., skill_tag_7]
    """
    skills: list[str] = json.loads(target_skills_json) if target_skills_json else []
    vec = torch.zeros(EXERCISE_DIMS, dtype=torch.float32)
    vec[0] = difficulty / 10.0
    for i, tag in enumerate(SKILL_TAGS):
        vec[1 + i] = 1.0 if tag in skills else 0.0
    return vec


def compute_improvement_delta(
    new_vector: dict[str, float],
    prev_vector: dict[str, float],
) -> float:
    """Mean per-metric improvement, clamped to [-1, 1].

    Metrics that are 'lower is better' (wrong_note_rate, missed_note_rate,
    tempo_deviation) are negated so improvement is always a positive delta.
    """
    lower_is_better = {"wrong_note_rate", "missed_note_rate", "tempo_deviation"}
    deltas = []
    for name in METRIC_NAMES:
        new_val = new_vector.get(name, 0.0)
        prev_val = prev_vector.get(name, 0.0)
        d = new_val - prev_val
        if name in lower_is_better:
            d = -d
        deltas.append(d)
    if not deltas:
        return 0.0
    return max(-1.0, min(1.0, sum(deltas) / len(deltas)))
