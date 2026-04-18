from __future__ import annotations

from pydantic import BaseModel


class ExerciseInput(BaseModel):
    exercise_id: str
    title: str
    difficulty: int
    target_skills: str          # raw JSON string, e.g. '["rhythm","right_hand"]'


class RecommendRequest(BaseModel):
    user_id: str
    learning_objectives: list[str]
    n_sessions: int
    recent_metrics: list[dict]  # list of metric_vector dicts, oldest → newest
    exercises: list[ExerciseInput]


class RecommendResponse(BaseModel):
    exercise_id: str
    strategy_hint: str | None = None
    selected_by: str            # "cnn" | "deterministic"
    cnn_epsilon: float


class TrainSample(BaseModel):
    history_snapshot: list[dict]
    exercise_difficulty: int
    exercise_skills: str        # raw JSON string
    improvement_delta: float


class TrainRequest(BaseModel):
    samples: list[TrainSample]


class TrainResponse(BaseModel):
    triggered: bool
