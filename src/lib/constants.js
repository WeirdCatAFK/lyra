// ─── Scaffold levels ───────────────────────────────────────────────────────
/**
 * Ordered list of scaffold levels from least to most visual aid.
 * Use scaffoldAtLeast() rather than comparing strings directly.
 */
export const SCAFFOLD_LEVELS = ['bare', 'position', 'label', 'color', 'full']

/**
 * Returns true if `current` provides at least as many aids as `minimum`.
 * Defaults to 'full' if current is unrecognised.
 *
 * @param {string} current
 * @param {string} minimum
 * @returns {boolean}
 */
export function scaffoldAtLeast(current = 'full', minimum) {
  const idx = SCAFFOLD_LEVELS.indexOf(current)
  const min = SCAFFOLD_LEVELS.indexOf(minimum)
  return (idx === -1 ? SCAFFOLD_LEVELS.length - 1 : idx) >= min
}

// ─── Keyboard layout ───────────────────────────────────────────────────────
export const KEYBOARD_START_OCTAVE  = 2
export const KEYBOARD_OCTAVES       = 5
export const KEYBOARD_HEIGHT_PX     = 140

// ─── Playback engine ───────────────────────────────────────────────────────
/** Beat position before the first note starts (lead-in) */
export const BEAT_START_OFFSET      = -2
/** Fraction of a beat advanced per interval tick */
export const TICK_FRACTION          = 0.05

// ─── Visual timing ─────────────────────────────────────────────────────────
/** How many beats it takes for a note tile to fall from the top of the lane to the keyboard */
export const BEATS_TO_FALL          = 4
/** How many beats of notes are visible in the music score at once */
export const BEATS_VISIBLE_IN_SCORE = 8
/** Default score height in pixels */
export const SCORE_HEIGHT_PX        = 200

// ─── Metrics ───────────────────────────────────────────────────────────────
/** Weights for the composite performance score (must sum to 1.0) */
export const METRIC_WEIGHT_PITCH      = 0.5
export const METRIC_WEIGHT_TIMING     = 0.3
export const METRIC_WEIGHT_COMPLETION = 0.2

/** A note played within this many beats of the expected time is considered on time */
export const TIMING_TOLERANCE_BEATS = 0.25

// ─── JSDoc typedefs ────────────────────────────────────────────────────────

/**
 * A single note event in beat-based time.
 *
 * @typedef {Object} NoteEvent
 * @property {string}            id
 * @property {number}            pitch      - MIDI pitch (0–127)
 * @property {number}            startTime  - Start position in beats (float)
 * @property {number}            duration   - Duration in beats (float, minimum 0.1)
 * @property {"left"|"right"}    hand
 * @property {1|2|3|4|5}        [finger]
 */

/**
 * Per-panel visibility. Omit any field to use its default (true = visible).
 *
 * @typedef {Object} PanelConfig
 * @property {boolean} [aiCommentary]
 * @property {boolean} [musicScore]
 * @property {boolean} [fallingNotes]
 * @property {boolean} [leftHand]
 * @property {boolean} [rightHand]
 * @property {boolean} [metronome]
 * @property {boolean} [playControls]
 * @property {boolean} [midiStatus]
 * @property {boolean} [devLog]       - Real-time event log panel (default false)
 */

/**
 * A metric definition owned by an exercise.
 * The exercise author writes the compute function; the evaluator calls it.
 *
 * @typedef {Object} MetricDefinition
 * @property {string} label      - Human-readable identifier (e.g. "rhythm", "recall")
 * @property {number} difficulty - 0.0–1.0, how hard this metric is in this specific exercise
 * @property {function(
 *   expectedNotes: NoteEvent[],
 *   playedNotes: Array<{ pitch: number, beat: number }>
 * ): number} compute            - Returns a score 0.0–1.0
 */

/**
 * A single measured outcome, sent to the backend inside ExerciseResult.
 *
 * @typedef {Object} MetricResult
 * @property {string} label       - Matches the MetricDefinition label
 * @property {number} value       - Score 0.0–1.0 returned by compute()
 * @property {number} difficulty  - Echoed from MetricDefinition
 * @property {number} [delta]     - Improvement vs. previous attempt (−1 to +1), filled by backend
 */

/**
 * Full result sent to the backend after an exercise loop completes.
 * The backend / CNN uses this to schedule the next exercise.
 *
 * @typedef {Object} ExerciseResult
 * @property {string}         [exerciseId]
 * @property {MetricResult[]} metrics
 * @property {number}         completedAt - Date.now() timestamp
 */

/**
 * Maps a MIDI pitch to a fingering instruction code.
 * Format: "L1"–"L5" (left hand, fingers 1–5) or "R1"–"R5" (right hand).
 * Finger 1 = thumb, 5 = pinky.
 *
 * Example: { 60: "R1", 48: "L5" }
 *   → C4 is played with the right thumb, C3 with the left pinky.
 *
 * @typedef {Object.<number, string>} FingeringMap
 */

/**
 * A timed fingering change applied mid-exercise.
 * The provided map is merged into the current active FingeringMap at the
 * given beat — only the specified pitches are affected, others persist.
 *
 * @typedef {Object} FingeringChange
 * @property {number}       beat - Beat at which to apply the map update
 * @property {FingeringMap} map
 */

/**
 * Top-level config passed to ExerciseInterface.
 *
 * @typedef {Object} ExerciseConfig
 * @property {string}                          [id]
 * @property {number}                          bpm
 * @property {NoteEvent[]}                     notes
 * @property {number}                          [difficultyLevel]       - 0.0–1.0, default 0.5
 * @property {PanelConfig}                     [panels]
 * @property {string[]}                        [aiCommentaryLines]
 * @property {string}                          [exerciseInstruction]
 * @property {("left"|"right")[]}              [activeHands]
 * @property {{ startOctave?: number, octaves?: number }} [keyboard]
 * @property {FingeringMap}                    [fingeringMap]          - Initial pitch → fingering code assignments
 * @property {FingeringChange[]}               [fingeringChanges]      - Timed mid-exercise fingering updates
 * @property {MetricDefinition[]}              [metrics]               - Which metrics this exercise measures and how
 * @property {'free'|'step'}                              [mode]     - 'free' = timer-driven (default); 'step' = beat advances only on correct note
 * @property {'bare'|'position'|'label'|'color'|'full'} [scaffold]  - Visual aid level, default 'full'
 * @property {number}                          [beatsPerMeasure]       - Time signature numerator for score, default 4
 * @property {function(
 *   pitch:       number,
 *   beat:        number,
 *   activeNotes: NoteEvent[]
 * ): string|null} [onNoteHint]                                       - Return a hint string on note press, or null
 * @property {function(ExerciseResult): void}  [onComplete]
 */
