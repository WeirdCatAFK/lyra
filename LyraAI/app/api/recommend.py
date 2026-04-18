from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..engine.blender import EngineBlender
from ..engine.llm_layer import GeminiLLMLayer, StateReport
from ..registry import get_engine
from ..schemas import RecommendRequest, RecommendResponse

router = APIRouter(tags=["recommend"])

_llm = GeminiLLMLayer()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest):
    blender = EngineBlender(n_sessions=body.n_sessions)
    engine = get_engine(body.user_id)

    exercise_dicts = [
        {
            "exercise_id": ex.exercise_id,
            "title": ex.title,
            "difficulty": ex.difficulty,
            "target_skills": ex.target_skills,
        }
        for ex in body.exercises
    ]

    scores = engine.score_exercises(
        body.recent_metrics,
        [{"difficulty": ex.difficulty, "target_skills": ex.target_skills} for ex in body.exercises],
    )
    use_cnn = blender.should_use_cnn(engine.is_ready)
    ranked = blender.rank_exercises(exercise_dicts, scores, use_cnn)

    if not ranked:
        raise HTTPException(status_code=503, detail="No exercises available")

    top = ranked[0]
    ex_id_to_score = {ex.exercise_id: s for ex, s in zip(body.exercises, scores)}
    top_confidence = ex_id_to_score.get(top["exercise_id"], 0.0) if use_cnn else 0.0

    if _llm.enabled:
        state_report = StateReport(
            user_id=body.user_id,
            learning_objectives=body.learning_objectives,
            cnn_recommendation=top,
            cnn_confidence=top_confidence,
            recent_metrics=body.recent_metrics,
            n_sessions=body.n_sessions,
        )
        decision = _llm.process(state_report)
        resolved = decision.exercise
        strategy_hint = decision.strategy_hint
    else:
        resolved = top
        strategy_hint = None

    return RecommendResponse(
        exercise_id=resolved["exercise_id"],
        strategy_hint=strategy_hint,
        selected_by=resolved.get("selected_by", "deterministic"),
        cnn_epsilon=blender.epsilon,
        llm_active=_llm.enabled,
    )
