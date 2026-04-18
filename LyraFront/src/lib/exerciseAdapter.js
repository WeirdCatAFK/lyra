/**
 * Converts a backend exercise object (from GET /users/:id/next-exercise)
 * into an ExerciseConfig that ExerciseInterface can consume.
 */

// ── metric compute functions ──────────────────────────────────────────────────
// Mapped to backend metric names so the result object keys match what the
// backend expects in metric_vector.

import { TIMING_TOLERANCE_BEATS } from './constants.js';

function pitchAccuracy(expected, played) {
  if (!expected.length) return 0;
  const playedPitches = new Set(played.map(p => p.pitch));
  return expected.filter(n => playedPitches.has(n.pitch)).length / expected.length;
}

function wrongNoteRate(expected, played) {
  if (!played.length) return 0;
  const expectedPitches = new Set(expected.map(n => n.pitch));
  return played.filter(p => !expectedPitches.has(p.pitch)).length / played.length;
}

function missedNoteRate(expected, played) {
  if (!expected.length) return 0;
  const playedPitches = new Set(played.map(p => p.pitch));
  return expected.filter(n => !playedPitches.has(n.pitch)).length / expected.length;
}

function rhythmConsistency(expected, played) {
  if (expected.length < 2 || played.length < 2) return 0;
  const expBeats    = [...expected].sort((a, b) => a.startTime - b.startTime).map(n => n.startTime);
  const playedBeats = [...played].sort((a, b) => a.beat - b.beat).map(p => p.beat);
  const expIOI    = expBeats.slice(1).map((b, i) => b - expBeats[i]);
  const playedIOI = playedBeats.slice(1).map((b, i) => b - playedBeats[i]);
  const len = Math.min(expIOI.length, playedIOI.length);
  if (!len) return 0;
  let total = 0;
  for (let i = 0; i < len; i++) {
    total += Math.max(0, 1 - Math.abs(expIOI[i] - playedIOI[i]) / TIMING_TOLERANCE_BEATS);
  }
  return total / len;
}

function timingAccuracy(expected, played) {
  if (!expected.length) return 0;
  const byPitch = {};
  for (const p of played) {
    if (!byPitch[p.pitch]) byPitch[p.pitch] = [];
    byPitch[p.pitch].push(p.beat);
  }
  const scores = [];
  for (const note of expected) {
    const candidates = byPitch[note.pitch];
    if (!candidates?.length) continue;
    const bestError = candidates.reduce((min, b) => Math.min(min, Math.abs(b - note.startTime)), Infinity);
    scores.push(Math.max(0, 1 - bestError / TIMING_TOLERANCE_BEATS));
  }
  return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
}

// Maps backend metric names → compute functions
const METRIC_COMPUTE = {
  note_accuracy:        pitchAccuracy,
  wrong_note_rate:      wrongNoteRate,
  missed_note_rate:     missedNoteRate,
  rhythm_consistency:   rhythmConsistency,
  tempo_deviation:      (e, p) => 1 - timingAccuracy(e, p),
  note_length_accuracy: timingAccuracy,
  legato_adherence:     timingAccuracy,
  hand_independence:    pitchAccuracy,
  velocity_mean:        () => 0.5,
  velocity_variance:    () => 0.5,
};

// ── main adapter ──────────────────────────────────────────────────────────────

/**
 * @param {object} backendExercise  — shape returned by GET /users/:id/next-exercise
 * @param {string|null} strategyHint
 * @param {function} onComplete     — called with (metricVector, durationS)
 * @returns {import('./constants').ExerciseConfig}
 */
export function adaptExercise(backendExercise, strategyHint, onComplete) {
  const { exercise_id, title, difficulty, notation = {}, metric_schema = {} } = backendExercise;

  const rawNotes   = notation.notes || [];
  const bpm        = notation.tempo_bpm || 60;

  const notes = rawNotes.map((n, i) => ({
    id:        `n${i}`,
    pitch:     n.pitch,
    startTime: n.startBeat ?? n.startTime ?? 0,
    duration:  n.duration ?? 1,
    hand:      n.hand || 'right',
    finger:    n.finger,
  }));

  const scaffold = difficulty <= 2 ? 'full'
    : difficulty <= 4 ? 'color'
    : difficulty <= 6 ? 'label'
    : difficulty <= 8 ? 'position'
    : 'bare';

  const metrics = Object.entries(metric_schema).map(([name, cfg]) => ({
    label:      name,
    difficulty: (cfg.weight || 1) * (difficulty / 10),
    compute:    METRIC_COMPUTE[name] || (() => 0),
  }));

  const aiCommentaryLines = strategyHint
    ? [strategyHint]
    : [`${title} — difficulty ${difficulty}`];

  let _startTime = null;

  return {
    id:    String(exercise_id),
    bpm,
    scaffold,
    notes,
    metrics,
    aiCommentaryLines,
    exerciseInstruction: title,
    onComplete(result) {
      const durationS = _startTime ? (Date.now() - _startTime) / 1000 : 0;

      // Build metric_vector keyed by backend metric names
      const metricVector = {};
      for (const m of result.metrics) {
        metricVector[m.label] = m.value;
      }

      onComplete(metricVector, durationS);
    },
    onMount() {
      _startTime = Date.now();
    },
  };
}
