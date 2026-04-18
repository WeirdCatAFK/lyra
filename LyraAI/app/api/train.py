from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks

from ..engine.trainer import train_user_model
from ..registry import get_engine
from ..schemas import TrainRequest, TrainResponse

router = APIRouter(tags=["train"])

_DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))


@router.post("/train/{user_id}", response_model=TrainResponse)
def train(user_id: str, body: TrainRequest, background_tasks: BackgroundTasks):
    weights_path = _DATA_DIR / "weights" / f"{user_id}.pt"
    engine = get_engine(user_id)
    samples = [s.model_dump() for s in body.samples]
    background_tasks.add_task(train_user_model, user_id, samples, weights_path, engine)
    return TrainResponse(triggered=True)
