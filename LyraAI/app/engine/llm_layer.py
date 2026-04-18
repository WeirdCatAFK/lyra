from __future__ import annotations

import logging
import os
from dataclasses import dataclass

log = logging.getLogger(__name__)


@dataclass
class StateReport:
    user_id: str
    learning_objectives: list[str]
    cnn_recommendation: dict         # the exercise dict CNN picked
    cnn_confidence: float            # top score from CNN (0 if deterministic)
    recent_metrics: list[dict]       # last N metric vectors
    n_sessions: int


@dataclass
class LLMDecision:
    action: str                      # "pass" | "override" | "generate" | "strategize"
    exercise: dict                   # resolved exercise dict
    strategy_hint: str | None = None


class LLMLayer:
    """Adaptive curriculum layer that sits between CNN and the frontend.

    Subclass and override `_call_llm` to plug in a real LLM (OpenAI, Anthropic, etc.).
    The default implementation is a no-op stub that always passes through CNN's pick.
    """

    def process(self, report: StateReport) -> LLMDecision:
        try:
            return self._decide(report)
        except Exception as exc:
            log.warning("LLM layer error, falling back to CNN pick: %s", exc)
            return LLMDecision(action="pass", exercise=report.cnn_recommendation)

    def _decide(self, report: StateReport) -> LLMDecision:
        hint = self._call_llm(report)
        if hint is None:
            return LLMDecision(action="pass", exercise=report.cnn_recommendation)
        return hint

    def _call_llm(self, report: StateReport) -> LLMDecision | None:
        """Override to add LLM integration. Return None to pass through CNN pick."""
        return None


class GeminiLLMLayer(LLMLayer):
    """LLM layer backed by Google Gemini (gemini-2.0-flash or similar).

    Set GEMINI_API_KEY env var to enable. Falls back to stub if key is absent.
    Override GEMINI_MODEL env var to change the model (default: gemini-2.0-flash).
    """

    _SYSTEM_PROMPT = (
        "You are Lyra, an AI music teacher. You receive a JSON state report describing "
        "a piano student's recent performance and the exercise recommended by a CNN scheduler. "
        "Your job is to decide one of:\n\n"
        '- "pass": accept the CNN\'s recommendation as-is\n'
        '- "strategize": add a strategy hint (a short note for the student, max 80 chars) '
        "to the CNN's recommendation without changing the exercise\n"
        '- "override": supply a different existing exercise_id from the catalog\n\n'
        'Respond with a JSON object: {"action": "pass"|"strategize"|"override", '
        '"exercise_id": "...", "strategy_hint": "..."}\n\n'
        "Rules:\n"
        "- Only override if the CNN pick is clearly wrong for the student's trajectory.\n"
        '- Keep strategy hints concise and actionable (e.g. "Slow to 60 BPM, focus left hand").\n'
        "- Never generate exercises — that feature is reserved for future expansion.\n"
        "- Never chat with the student. Output only the JSON."
    )

    def _call_llm(self, report: StateReport) -> LLMDecision | None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        try:
            import json
            import google.generativeai as genai  # type: ignore[import-not-found]

            genai.configure(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=self._SYSTEM_PROMPT,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=256,
                ),
            )

            payload = json.dumps({
                "user_id": report.user_id,
                "learning_objectives": report.learning_objectives,
                "cnn_recommendation": {
                    "exercise_id": report.cnn_recommendation.get("exercise_id"),
                    "title": report.cnn_recommendation.get("title"),
                    "difficulty": report.cnn_recommendation.get("difficulty"),
                    "target_skills": report.cnn_recommendation.get("target_skills"),
                },
                "cnn_confidence": report.cnn_confidence,
                "n_sessions": report.n_sessions,
                "recent_metrics_avg": _avg_metrics(report.recent_metrics),
            })

            resp = model.generate_content(payload)
            result = json.loads(resp.text)
            action = result.get("action", "pass")

            if action in ("pass", "strategize"):
                return LLMDecision(
                    action=action,
                    exercise=report.cnn_recommendation,
                    strategy_hint=result.get("strategy_hint"),
                )
            # "override" — return None; caller keeps CNN pick (override resolution not yet wired)
            return None

        except Exception as exc:
            log.warning("Gemini LLM call failed: %s", exc)
            return None


def _avg_metrics(rows: list[dict]) -> dict:
    if not rows:
        return {}
    keys = set().union(*rows)
    return {k: sum(r.get(k, 0.0) for r in rows) / len(rows) for k in keys}
