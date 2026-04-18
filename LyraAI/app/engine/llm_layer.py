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


_TRUE = {"1", "true", "yes", "on"}
_FALSE = {"0", "false", "no", "off"}


class GeminiLLMLayer(LLMLayer):
    """LLM layer backed by Google Gemini (gemini-2.0-flash or similar).

    Two operating modes:
      - CNN-only (default when GEMINI_API_KEY is absent or LYRA_USE_LLM=false):
        the layer is disabled, recommendations pass through CNN unmodified,
        no strategy hints are produced.
      - CNN + LLM (when GEMINI_API_KEY is set and LYRA_USE_LLM is unset/true):
        each CNN pick is reviewed by Gemini, which may add a strategy hint.

    Override GEMINI_MODEL env var to change the model (default: gemini-2.0-flash).
    """

    def __init__(self) -> None:
        flag = os.getenv("LYRA_USE_LLM", "").strip().lower()
        has_key = bool(os.getenv("GEMINI_API_KEY", "").strip())
        if flag in _FALSE:
            self._enabled = False
        elif flag in _TRUE:
            self._enabled = has_key
            if not has_key:
                log.warning("LYRA_USE_LLM=true but GEMINI_API_KEY is missing — running CNN-only.")
        else:
            self._enabled = has_key
        log.info("LLM layer %s (CNN-only cycle %s)",
                 "enabled" if self._enabled else "disabled",
                 "off" if self._enabled else "on")

    @property
    def enabled(self) -> bool:
        return self._enabled

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
        if not self._enabled:
            return None
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
