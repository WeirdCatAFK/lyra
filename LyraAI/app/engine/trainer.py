from __future__ import annotations

import logging
from pathlib import Path

import torch
import torch.nn as nn

from .cnn_engine import CNNEngine
from .cnn_model import RecommenderCNN
from .constants import MIN_TRAIN_SAMPLES
from .feature_builder import build_exercise_tensor, build_history_tensor

_EPOCHS = 5
_BATCH_SIZE = 16
_LR = 1e-3

log = logging.getLogger(__name__)


def train_user_model(
    user_id: str,
    samples: list[dict],
    weights_path: Path,
    engine: CNNEngine,
) -> tuple[float, int]:
    """Train (or fine-tune) the per-user RecommenderCNN on provided samples.

    Each sample dict must have: history_snapshot (list[dict]), exercise_difficulty (int),
    exercise_skills (JSON str), improvement_delta (float).
    Runs synchronously — invoke from a thread pool or BackgroundTask.
    Returns (avg_loss, n_samples).
    """
    if len(samples) < MIN_TRAIN_SAMPLES:
        return 0.0, 0

    X_history, X_exercise, Y = [], [], []
    for r in samples:
        try:
            history_rows = r["history_snapshot"]
            h = build_history_tensor(history_rows)
            e = build_exercise_tensor(
                int(r["exercise_difficulty"]),
                r["exercise_skills"] or "[]",
            )
            X_history.append(h.squeeze(0))
            X_exercise.append(e)
            Y.append(float(r["improvement_delta"]))
        except Exception:
            continue

    if not X_history:
        return 0.0, 0

    Xh = torch.stack(X_history)
    Xe = torch.stack(X_exercise)
    Yt = torch.tensor(Y, dtype=torch.float32).unsqueeze(1)
    n = len(X_history)

    model = RecommenderCNN()
    if weights_path.exists():
        try:
            model.load_state_dict(torch.load(str(weights_path), map_location="cpu"))
        except Exception:
            pass

    model.train()
    opt = torch.optim.Adam(model.parameters(), lr=_LR)
    loss_fn = nn.MSELoss()
    total_loss, steps = 0.0, 0

    for _ in range(_EPOCHS):
        perm = torch.randperm(n)
        for start in range(0, n, _BATCH_SIZE):
            idx = perm[start : start + _BATCH_SIZE]
            pred = model(Xh[idx], Xe[idx])
            loss = loss_fn(pred, Yt[idx])
            opt.zero_grad()
            loss.backward()
            opt.step()
            total_loss += loss.item()
            steps += 1

    weights_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), str(weights_path))
    engine.reload()

    avg = total_loss / steps if steps else 0.0
    log.info("user=%s trained cnn n=%d loss=%.4f", user_id, n, avg)
    return avg, n
