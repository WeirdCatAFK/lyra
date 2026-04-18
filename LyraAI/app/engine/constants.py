from __future__ import annotations

METRIC_NAMES: list[str] = [
    "note_accuracy",        # fraction of correct pitches (0–1)
    "wrong_note_rate",      # wrong notes / total expected (0–1, lower is better)
    "missed_note_rate",     # missed notes / total expected (0–1, lower is better)
    "tempo_deviation",      # abs(actual_bpm - target_bpm) / target_bpm, clamped 0–1
    "rhythm_consistency",   # 1 - std_dev(IOIs) / mean(IOIs), clamped 0–1
    "note_length_accuracy", # fraction of notes within acceptable duration window
    "velocity_mean",        # mean velocity / 127
    "velocity_variance",    # std_dev(velocity) / 64, clamped 0–1
    "legato_adherence",     # fraction of note transitions that are legato (0–1)
    "hand_independence",    # correlation-based score for two-hand exercises (0–1)
]

METRIC_DIMS: int = len(METRIC_NAMES)   # 10

SKILL_TAGS: list[str] = [
    "rhythm",
    "dynamics",
    "left_hand",
    "right_hand",
    "both_hands",
    "technique",
    "legato",
    "staccato",
]

EXERCISE_DIMS: int = 1 + len(SKILL_TAGS)   # difficulty(1) + skill tags(8) = 9

N_HISTORY: int = 10     # sessions of history fed to the CNN
MIN_TRAIN_SAMPLES: int = 5  # minimum rows before CNN training starts
