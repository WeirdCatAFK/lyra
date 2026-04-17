import { ExerciseInterface }     from './components/exercise/ExerciseInterface.jsx'
import { ExerciseResultOverlay } from './components/exercise/ExerciseResultOverlay.jsx'
import { useExerciseSession }    from './hooks/useExerciseSession.js'
import { pitchToNoteName }       from './lib/pianoLayout.js'
import { TIMING_TOLERANCE_BEATS } from './lib/constants.js'

// ─── Shared metric compute functions ────────────────────────────────────────
// Private to this file — each exercise picks whichever it needs.

function computePitchAccuracy(expected, played) {
  if (expected.length === 0) return 0
  const playedPitches = new Set(played.map((p) => p.pitch))
  return expected.filter((n) => playedPitches.has(n.pitch)).length / expected.length
}

function computeTiming(expected, played) {
  if (expected.length === 0) return 0
  const byPitch = {}
  for (const p of played) {
    if (!byPitch[p.pitch]) byPitch[p.pitch] = []
    byPitch[p.pitch].push(p.beat)
  }
  const scores = []
  for (const note of expected) {
    const candidates = byPitch[note.pitch]
    if (!candidates?.length) continue
    const bestError = candidates.reduce((min, b) => Math.min(min, Math.abs(b - note.startTime)), Infinity)
    scores.push(Math.max(0, 1 - bestError / TIMING_TOLERANCE_BEATS))
  }
  return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0
}

// Precision for step mode: correct_attempts / total_attempts.
// computePitchAccuracy is trivially 100% in step mode because the exercise only
// advances on correct notes — every expected pitch is guaranteed to be in played.
// This metric instead penalises wrong attempts: if you play 12 correct notes and
// 4 wrong ones the score is 12/16 = 75%.
function computeStepPrecision(expected, played) {
  if (played.length === 0) return 0
  const expectedPitches = new Set(expected.map((n) => n.pitch))
  const correct = played.filter((p) => expectedPitches.has(p.pitch)).length
  return correct / played.length
}

function computeRhythm(expected, played) {
  if (expected.length < 2 || played.length < 2) return 0
  const expBeats    = [...expected].sort((a, b) => a.startTime - b.startTime).map((n) => n.startTime)
  const playedBeats = [...played].sort((a, b) => a.beat - b.beat).map((p) => p.beat)
  const expIOI      = expBeats.slice(1).map((b, i) => b - expBeats[i])
  const playedIOI   = playedBeats.slice(1).map((b, i) => b - playedBeats[i])
  const len = Math.min(expIOI.length, playedIOI.length)
  if (len === 0) return 0
  let total = 0
  for (let i = 0; i < len; i++) {
    total += Math.max(0, 1 - Math.abs(expIOI[i] - playedIOI[i]) / TIMING_TOLERANCE_BEATS)
  }
  return total / len
}

// ─── Exercise 1: full scaffold — C major scale ──────────────────────────────
// Tests: scaffold 'full' (hand colors + finger labels), fingeringMap, onNoteHint,
//        both hands, all default panels visible.
const EXERCISE_BEGINNER = {
  id:  'beginner-c-major',
  bpm: 72,
  scaffold: 'full',

  notes: [
    { id: 'r1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 62, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 64, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 67, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 69, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 71, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 72, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0, duration: 4, hand: 'left' },
    { id: 'l2', pitch: 43, startTime: 4, duration: 4, hand: 'left' },
  ],

  fingeringMap: {
    60: 'R1', 62: 'R2', 64: 'R3', 65: 'R4',
    67: 'R1', 69: 'R2', 71: 'R3', 72: 'R4',
    48: 'L5', 43: 'L5',
  },

  aiCommentaryLines: [
    'Play each note with a relaxed, curved hand.',
    'Let the thumb pass under smoothly on the scale.',
  ],
  exerciseInstruction: 'C major scale — right hand, one octave.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.3, compute: computeTiming },
  ],

  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (expected.length === 0) return 'Wait for the next note...'
    if (!expected.includes(pitch)) {
      return `Expected ${expected.map(pitchToNoteName).join(', ')}`
    }
    return null
  },

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 2: color scaffold — chromatic run ─────────────────────────────
// Tests: scaffold 'color' (hand colors, no labels), eighth notes,
//        rhythm metric, fast note stream.
const EXERCISE_INTERMEDIATE = {
  id:  'intermediate-chromatic',
  bpm: 84,
  scaffold: 'color',

  notes: [
    { id: 'r1', pitch: 60, startTime: 0,   duration: 0.5, hand: 'right' },
    { id: 'r2', pitch: 61, startTime: 0.5, duration: 0.5, hand: 'right' },
    { id: 'r3', pitch: 62, startTime: 1,   duration: 0.5, hand: 'right' },
    { id: 'r4', pitch: 63, startTime: 1.5, duration: 0.5, hand: 'right' },
    { id: 'r5', pitch: 64, startTime: 2,   duration: 0.5, hand: 'right' },
    { id: 'r6', pitch: 65, startTime: 2.5, duration: 0.5, hand: 'right' },
    { id: 'r7', pitch: 66, startTime: 3,   duration: 0.5, hand: 'right' },
    { id: 'r8', pitch: 67, startTime: 3.5, duration: 0.5, hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0,   duration: 2,   hand: 'left' },
    { id: 'l2', pitch: 46, startTime: 2,   duration: 2,   hand: 'left' },
  ],

  fingeringMap: {
    60: 'R1', 61: 'R2', 62: 'R3', 63: 'R1',
    64: 'R2', 65: 'R3', 66: 'R4', 67: 'R5',
    48: 'L5', 46: 'L5',
  },

  aiCommentaryLines: ['Keep a steady tempo through the chromatic run.'],
  exerciseInstruction: 'Chromatic passage — stay even.',

  metrics: [
    { label: 'rhythm',         difficulty: 0.6, compute: computeRhythm },
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.7, compute: computeTiming },
  ],

  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (!expected.includes(pitch) && expected.length > 0) return 'Wrong note — follow the colours'
    return null
  },

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 3: label scaffold — A natural minor scale ─────────────────────
// Tests: scaffold 'label' (note names on neutral-color tiles, no hand colors),
//        accidentals in music score (natural minor has no sharps/flats but
//        verifies the label path), panels.rightHand hidden.
const EXERCISE_LABEL_SCAFFOLD = {
  id:  'label-a-minor',
  bpm: 76,
  scaffold: 'label',
  panels: { rightHand: false },

  notes: [
    { id: 'r1', pitch: 69, startTime: 0, duration: 1, hand: 'right' }, // A4
    { id: 'r2', pitch: 71, startTime: 1, duration: 1, hand: 'right' }, // B4
    { id: 'r3', pitch: 72, startTime: 2, duration: 1, hand: 'right' }, // C5
    { id: 'r4', pitch: 74, startTime: 3, duration: 1, hand: 'right' }, // D5
    { id: 'r5', pitch: 76, startTime: 4, duration: 1, hand: 'right' }, // E5
    { id: 'r6', pitch: 77, startTime: 5, duration: 1, hand: 'right' }, // F5
    { id: 'r7', pitch: 79, startTime: 6, duration: 1, hand: 'right' }, // G5
    { id: 'r8', pitch: 81, startTime: 7, duration: 1, hand: 'right' }, // A5
    { id: 'l1', pitch: 45, startTime: 0, duration: 4, hand: 'left'  }, // A2
    { id: 'l2', pitch: 40, startTime: 4, duration: 4, hand: 'left'  }, // E2
  ],

  aiCommentaryLines: [
    'Note names are shown on each tile — read them as you play.',
    'Right hand diagram is hidden for this exercise.',
  ],
  exerciseInstruction: 'A natural minor scale — note names visible.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.4, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 4: position scaffold — G major scale ──────────────────────────
// Tests: scaffold 'position' (keyboard key guide only — tiles are neutral,
//        no labels), verifies that expectedNotes feeds PianoKeyboard highlights
//        while FallingNotes shows plain grey tiles.
const EXERCISE_POSITION_SCAFFOLD = {
  id:  'position-g-major',
  bpm: 80,
  scaffold: 'position',

  notes: [
    { id: 'r1', pitch: 67, startTime: 0, duration: 1, hand: 'right' }, // G4
    { id: 'r2', pitch: 69, startTime: 1, duration: 1, hand: 'right' }, // A4
    { id: 'r3', pitch: 71, startTime: 2, duration: 1, hand: 'right' }, // B4
    { id: 'r4', pitch: 72, startTime: 3, duration: 1, hand: 'right' }, // C5
    { id: 'r5', pitch: 74, startTime: 4, duration: 1, hand: 'right' }, // D5
    { id: 'r6', pitch: 76, startTime: 5, duration: 1, hand: 'right' }, // E5
    { id: 'r7', pitch: 78, startTime: 6, duration: 1, hand: 'right' }, // F#5 — tests accidental in score
    { id: 'r8', pitch: 79, startTime: 7, duration: 1, hand: 'right' }, // G5
    { id: 'l1', pitch: 43, startTime: 0, duration: 4, hand: 'left'  }, // G2
    { id: 'l2', pitch: 38, startTime: 4, duration: 4, hand: 'left'  }, // D2
  ],

  aiCommentaryLines: [
    'Only the keyboard highlights guide you — tiles show no colour or label.',
    'Watch the keys light up ahead of each note.',
  ],
  exerciseInstruction: 'G major scale — keyboard guide only.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 5: 3/4 waltz — Alberti-style bass ─────────────────────────────
// Tests: beatsPerMeasure: 3 (score renders 3/4 time signature and fits
//        three beats per measure), mixed note durations in left hand,
//        scaffold 'color'.
const EXERCISE_WALTZ = {
  id:  'waltz-3-4',
  bpm: 66,
  scaffold: 'color',
  beatsPerMeasure: 3,

  notes: [
    // ── Right hand melody (2 measures × 3 beats) ───────────────────────────
    { id: 'r1', pitch: 64, startTime: 0, duration: 1,   hand: 'right' }, // E4  ♩
    { id: 'r2', pitch: 67, startTime: 1, duration: 0.5, hand: 'right' }, // G4  ♪
    { id: 'r3', pitch: 69, startTime: 1.5, duration: 0.5, hand: 'right' }, // A4 ♪
    { id: 'r4', pitch: 71, startTime: 2, duration: 1,   hand: 'right' }, // B4  ♩
    { id: 'r5', pitch: 72, startTime: 3, duration: 1.5, hand: 'right' }, // C5  ♩.
    { id: 'r6', pitch: 71, startTime: 4.5, duration: 0.5, hand: 'right' }, // B4 ♪
    { id: 'r7', pitch: 69, startTime: 5, duration: 1,   hand: 'right' }, // A4  ♩

    // ── Left hand waltz bass (root on 1, chord on 2 and 3) ─────────────────
    { id: 'l1', pitch: 48, startTime: 0,   duration: 1, hand: 'left' }, // C3 root
    { id: 'l2', pitch: 52, startTime: 1,   duration: 1, hand: 'left' }, // E3 chord tone
    { id: 'l3', pitch: 55, startTime: 2,   duration: 1, hand: 'left' }, // G3 chord tone
    { id: 'l4', pitch: 43, startTime: 3,   duration: 1, hand: 'left' }, // G2 root
    { id: 'l5', pitch: 47, startTime: 4,   duration: 1, hand: 'left' }, // B2 chord tone
    { id: 'l6', pitch: 50, startTime: 5,   duration: 1, hand: 'left' }, // D3 chord tone
  ],

  fingeringMap: {
    64: 'R3', 67: 'R2', 69: 'R1', 71: 'R2', 72: 'R1',
    48: 'L5', 52: 'L3', 55: 'L1',
    43: 'L5', 47: 'L3', 50: 'L1',
  },

  aiCommentaryLines: [
    'Feel the waltz pulse: strong beat ONE, lighter beats two and three.',
    'Left hand plays root–chord–chord each measure.',
  ],
  exerciseInstruction: 'Waltz in C — 3/4 time.',

  metrics: [
    { label: 'rhythm',         difficulty: 0.6, compute: computeRhythm },
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 6: chord block progression ────────────────────────────────────
// Tests: multiple notes sharing the same startTime and hand — these are
//        rendered as chord clusters in MusicScore and stacked tiles in
//        FallingNotes. Scaffold 'full' so finger labels appear on each tile.
const EXERCISE_CHORDS = {
  id:  'chords-progression',
  bpm: 60,
  scaffold: 'full',

  notes: [
    // C major  (beat 0, dur 1.5)
    { id: 'c1a', pitch: 60, startTime: 0,   duration: 1.5, hand: 'right' }, // C4
    { id: 'c1b', pitch: 64, startTime: 0,   duration: 1.5, hand: 'right' }, // E4
    { id: 'c1c', pitch: 67, startTime: 0,   duration: 1.5, hand: 'right' }, // G4
    // A minor  (beat 1.5, dur 1.5)
    { id: 'c2a', pitch: 69, startTime: 1.5, duration: 1.5, hand: 'right' }, // A4
    { id: 'c2b', pitch: 72, startTime: 1.5, duration: 1.5, hand: 'right' }, // C5
    { id: 'c2c', pitch: 76, startTime: 1.5, duration: 1.5, hand: 'right' }, // E5
    // F major  (beat 3, dur 1.5)
    { id: 'c3a', pitch: 65, startTime: 3,   duration: 1.5, hand: 'right' }, // F4
    { id: 'c3b', pitch: 69, startTime: 3,   duration: 1.5, hand: 'right' }, // A4
    { id: 'c3c', pitch: 72, startTime: 3,   duration: 1.5, hand: 'right' }, // C5
    // G major  (beat 4.5, dur 1.5)
    { id: 'c4a', pitch: 67, startTime: 4.5, duration: 1.5, hand: 'right' }, // G4
    { id: 'c4b', pitch: 71, startTime: 4.5, duration: 1.5, hand: 'right' }, // B4
    { id: 'c4c', pitch: 74, startTime: 4.5, duration: 1.5, hand: 'right' }, // D5

    // Left hand roots (whole half-notes)
    { id: 'lb1', pitch: 48, startTime: 0,   duration: 3, hand: 'left' }, // C3
    { id: 'lb2', pitch: 53, startTime: 3,   duration: 3, hand: 'left' }, // F3  (tests dotted-half in score)
  ],

  fingeringMap: {
    60: 'R1', 64: 'R2', 67: 'R3',  // C major — 1,2,3 cluster
    69: 'R1', 72: 'R2', 76: 'R3',  // A minor — same shape
    65: 'R1', 72: 'R3',             // F major — thumb on F, skip
    71: 'R2', 74: 'R3',             // G major — complete
    48: 'L5', 53: 'L5',
  },

  aiCommentaryLines: [
    'Press all three notes of each chord together.',
    'Keep the wrist relaxed — let the arm weight do the work.',
  ],
  exerciseInstruction: 'C — Am — F — G chord progression.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 7: fingeringChanges — thumb-crossover ─────────────────────────
// Tests: fingeringChanges[] — at beat 4 the fingeringMap is patched live.
//        First half uses R1–R4; second half the same pitches get R2–R5,
//        simulating a re-fingering after a thumb-under crossover.
//        The hand diagram and tile labels should update visibly at beat 4.
const EXERCISE_FINGERING_CHANGES = {
  id:  'fingering-crossover',
  bpm: 72,
  scaffold: 'full',
  panels: { devLog: true },

  notes: [
    // First half — C D E F (beats 0–3)
    { id: 'r1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 62, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 64, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
    // Second half — same pitches (beats 4–7), fingering will change at beat 4
    { id: 'r5', pitch: 60, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 62, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 64, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 65, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0, duration: 8, hand: 'left'  },
  ],

  // Initial fingering: thumb on C (R1)
  fingeringMap: { 60: 'R1', 62: 'R2', 64: 'R3', 65: 'R4', 48: 'L5' },

  // At beat 4 the thumb-under has happened — shift all fingers up by one
  fingeringChanges: [
    { beat: 4, map: { 60: 'R2', 62: 'R3', 64: 'R4', 65: 'R5' } },
  ],

  aiCommentaryLines: [
    'Watch the finger numbers change at beat 4 — the thumb crosses under.',
    'Dev log panel is visible to trace the fingeringChanges event.',
  ],
  exerciseInstruction: 'C–D–E–F twice with a fingering crossover at the repeat.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 8: bare scaffold — sight reading ───────────────────────────────
// Tests: scaffold 'bare' (no colors, no labels, no keyboard highlight),
//        panels hiding metronome + both hand diagrams,
//        higher BPM and mixed rhythm (quarter + dotted-quarter + eighth).
const EXERCISE_BARE = {
  id:  'bare-sight-reading',
  bpm: 100,
  scaffold: 'bare',
  panels: { leftHand: false, rightHand: false, metronome: false },

  notes: [
    { id: 'r1', pitch: 64, startTime: 0,   duration: 1,   hand: 'right' }, // E4  ♩
    { id: 'r2', pitch: 67, startTime: 1,   duration: 1.5, hand: 'right' }, // G4  ♩.
    { id: 'r3', pitch: 69, startTime: 2.5, duration: 0.5, hand: 'right' }, // A4  ♪
    { id: 'r4', pitch: 71, startTime: 3,   duration: 1,   hand: 'right' }, // B4  ♩
    { id: 'r5', pitch: 72, startTime: 4,   duration: 2,   hand: 'right' }, // C5  𝅗𝅥
    { id: 'r6', pitch: 71, startTime: 6,   duration: 0.5, hand: 'right' }, // B4  ♪
    { id: 'r7', pitch: 69, startTime: 6.5, duration: 0.5, hand: 'right' }, // A4  ♪
    { id: 'r8', pitch: 67, startTime: 7,   duration: 1,   hand: 'right' }, // G4  ♩

    { id: 'l1', pitch: 52, startTime: 0,   duration: 2,   hand: 'left'  }, // E3
    { id: 'l2', pitch: 55, startTime: 2,   duration: 2,   hand: 'left'  }, // G3
    { id: 'l3', pitch: 57, startTime: 4,   duration: 4,   hand: 'left'  }, // A3
  ],

  aiCommentaryLines: [
    'No visual guides — read the score and listen.',
    'Hand diagrams and metronome are hidden.',
  ],
  exerciseInstruction: 'Bare scaffold: score and falling tiles only.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.8, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.8, compute: computeTiming },
    { label: 'rhythm',         difficulty: 0.7, compute: computeRhythm },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 9: step mode — D major scale ───────────────────────────────────
// Tests: mode 'step' — beat is frozen until the correct note is played.
//        Metronome hidden (no tempo). Keyboard guide + color tiles show which
//        note to press. The ST event in the dev log fires on each advance.
const EXERCISE_STEP_SCALE = {
  id:  'step-d-major',
  bpm: 72,
  mode: 'step',
  scaffold: 'full',
  panels: { metronome: false },

  notes: [
    { id: 'r1', pitch: 62, startTime: 0, duration: 1, hand: 'right' }, // D4
    { id: 'r2', pitch: 64, startTime: 1, duration: 1, hand: 'right' }, // E4
    { id: 'r3', pitch: 66, startTime: 2, duration: 1, hand: 'right' }, // F#4
    { id: 'r4', pitch: 67, startTime: 3, duration: 1, hand: 'right' }, // G4
    { id: 'r5', pitch: 69, startTime: 4, duration: 1, hand: 'right' }, // A4
    { id: 'r6', pitch: 71, startTime: 5, duration: 1, hand: 'right' }, // B4
    { id: 'r7', pitch: 73, startTime: 6, duration: 1, hand: 'right' }, // C#5
    { id: 'r8', pitch: 74, startTime: 7, duration: 1, hand: 'right' }, // D5
    { id: 'l1', pitch: 50, startTime: 0, duration: 4, hand: 'left'  }, // D3
    { id: 'l2', pitch: 45, startTime: 4, duration: 4, hand: 'left'  }, // A2
  ],

  fingeringMap: {
    62: 'R1', 64: 'R2', 66: 'R3', 67: 'R4',
    69: 'R1', 71: 'R2', 73: 'R3', 74: 'R4',
    50: 'L5', 45: 'L5',
  },

  aiCommentaryLines: [
    'Press the highlighted key — the exercise waits for you.',
    'There is no tempo: take as long as you need.',
  ],
  exerciseInstruction: 'D major scale — step mode.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computeStepPrecision },
  ],

  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (expected.length > 0 && !expected.includes(pitch)) {
      return `Wrong note — try again`
    }
    return null
  },

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 10: step mode — chord exercise ─────────────────────────────────
// Tests: step mode with chords — ALL notes that share a startTime must be hit
//        before the beat advances. Pressing only 2 of 3 notes is not enough.
const EXERCISE_STEP_CHORDS = {
  id:  'step-triads',
  bpm: 60,
  mode: 'step',
  scaffold: 'full',
  panels: { metronome: false },

  notes: [
    // C major triad
    { id: 'c1a', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'c1b', pitch: 64, startTime: 0, duration: 1, hand: 'right' },
    { id: 'c1c', pitch: 67, startTime: 0, duration: 1, hand: 'right' },
    // G major triad
    { id: 'c2a', pitch: 67, startTime: 1, duration: 1, hand: 'right' },
    { id: 'c2b', pitch: 71, startTime: 1, duration: 1, hand: 'right' },
    { id: 'c2c', pitch: 74, startTime: 1, duration: 1, hand: 'right' },
    // A minor triad
    { id: 'c3a', pitch: 69, startTime: 2, duration: 1, hand: 'right' },
    { id: 'c3b', pitch: 72, startTime: 2, duration: 1, hand: 'right' },
    { id: 'c3c', pitch: 76, startTime: 2, duration: 1, hand: 'right' },
    // F major triad
    { id: 'c4a', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
    { id: 'c4b', pitch: 69, startTime: 3, duration: 1, hand: 'right' },
    { id: 'c4c', pitch: 72, startTime: 3, duration: 1, hand: 'right' },
    // Left hand roots
    { id: 'l1', pitch: 48, startTime: 0, duration: 2, hand: 'left' },
    { id: 'l2', pitch: 41, startTime: 2, duration: 2, hand: 'left' },
  ],

  fingeringMap: {
    60: 'R1', 64: 'R2', 67: 'R3',
    71: 'R2', 74: 'R3',
    69: 'R1', 72: 'R2', 76: 'R3',
    65: 'R1', 48: 'L5', 41: 'L5',
  },

  aiCommentaryLines: [
    'Press ALL three notes of each chord before the next chord appears.',
    'Partial hits do not advance — the chord waits until complete.',
  ],
  exerciseInstruction: 'C — G — Am — F  step mode.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computeStepPrecision },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 11: no falling notes — score + keyboard guide ─────────────────
// Tests: panels.fallingNotes: false — only the music score and keyboard
//        highlights remain as visual guides. scaffold 'position' keeps
//        the keyboard key lit without tile colors or labels.
const EXERCISE_SCORE_ONLY = {
  id:  'score-only-pentatonic',
  bpm: 80,
  scaffold: 'position',
  panels: { fallingNotes: false },

  notes: [
    { id: 'r1', pitch: 60, startTime: 0,   duration: 1,   hand: 'right' }, // C4
    { id: 'r2', pitch: 64, startTime: 1,   duration: 1,   hand: 'right' }, // E4
    { id: 'r3', pitch: 67, startTime: 2,   duration: 1,   hand: 'right' }, // G4
    { id: 'r4', pitch: 69, startTime: 3,   duration: 1,   hand: 'right' }, // A4
    { id: 'r5', pitch: 72, startTime: 4,   duration: 1,   hand: 'right' }, // C5
    { id: 'r6', pitch: 69, startTime: 5,   duration: 1,   hand: 'right' }, // A4
    { id: 'r7', pitch: 67, startTime: 6,   duration: 1,   hand: 'right' }, // G4
    { id: 'r8', pitch: 64, startTime: 7,   duration: 1,   hand: 'right' }, // E4
    { id: 'l1', pitch: 48, startTime: 0,   duration: 4,   hand: 'left'  }, // C3
    { id: 'l2', pitch: 43, startTime: 4,   duration: 4,   hand: 'left'  }, // G2
  ],

  aiCommentaryLines: [
    'No falling tiles — read the score and watch the keyboard.',
    'The playhead and lit keys are your only real-time guides.',
  ],
  exerciseInstruction: 'C pentatonic — score and keyboard only.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise 12: no falling notes + bare scaffold ───────────────────────────
// Tests: panels.fallingNotes: false AND scaffold 'bare' — the only guide is
//        the music score. No keyboard highlight, no tile colors, no hand
//        diagrams. Pure score reading.
const EXERCISE_SCORE_BARE = {
  id:  'score-bare-reading',
  bpm: 84,
  scaffold: 'bare',
  panels: { fallingNotes: false, leftHand: false, rightHand: false },

  notes: [
    { id: 'r1', pitch: 64, startTime: 0,   duration: 1,   hand: 'right' }, // E4
    { id: 'r2', pitch: 66, startTime: 1,   duration: 0.5, hand: 'right' }, // F#4
    { id: 'r3', pitch: 67, startTime: 1.5, duration: 0.5, hand: 'right' }, // G4
    { id: 'r4', pitch: 69, startTime: 2,   duration: 1,   hand: 'right' }, // A4
    { id: 'r5', pitch: 71, startTime: 3,   duration: 2,   hand: 'right' }, // B4
    { id: 'r6', pitch: 69, startTime: 5,   duration: 0.5, hand: 'right' }, // A4
    { id: 'r7', pitch: 67, startTime: 5.5, duration: 0.5, hand: 'right' }, // G4
    { id: 'r8', pitch: 64, startTime: 6,   duration: 2,   hand: 'right' }, // E4

    { id: 'l1', pitch: 52, startTime: 0,   duration: 2,   hand: 'left'  }, // E3
    { id: 'l2', pitch: 57, startTime: 2,   duration: 2,   hand: 'left'  }, // A3
    { id: 'l3', pitch: 59, startTime: 4,   duration: 4,   hand: 'left'  }, // B3
  ],

  aiCommentaryLines: [
    'Score reading only — no keyboard highlights, no falling tiles.',
    'Hand diagrams are hidden. Trust the score.',
  ],
  exerciseInstruction: 'E minor melody — bare score reading.',

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.7, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.7, compute: computeTiming },
    { label: 'rhythm',         difficulty: 0.6, compute: computeRhythm },
  ],

  onComplete(result) {
    console.group('Exercise complete — %s', result.exerciseId)
    result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
    console.groupEnd()
  },
}

// ─── Exercise list ───────────────────────────────────────────────────────────

const EXERCISES = [
  EXERCISE_BEGINNER,           // scaffold: full,     both hands, fingeringMap
  EXERCISE_INTERMEDIATE,       // scaffold: color,    eighth notes, rhythm metric
  EXERCISE_LABEL_SCAFFOLD,     // scaffold: label,    note-name tiles, rightHand panel hidden
  EXERCISE_POSITION_SCAFFOLD,  // scaffold: position, keyboard guide only, accidental (F#)
  EXERCISE_WALTZ,              // scaffold: color,    beatsPerMeasure: 3, mixed durations
  EXERCISE_CHORDS,             // scaffold: full,     chords (same startTime + hand)
  EXERCISE_FINGERING_CHANGES,  // scaffold: full,     fingeringChanges[] live patch at beat 4
  EXERCISE_BARE,               // scaffold: bare,     panels hidden, high BPM, mixed rhythm
  EXERCISE_STEP_SCALE,         // mode: step,         one note at a time — D major scale
  EXERCISE_STEP_CHORDS,        // mode: step,         full chord required before advancing
  EXERCISE_SCORE_ONLY,         // fallingNotes: false, score + keyboard guide (position scaffold)
  EXERCISE_SCORE_BARE,         // fallingNotes: false, score only, bare scaffold, no keyboard highlight
]

export default function App() {
  const { currentConfig, index, total, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES)

  return (
    <div className="relative w-full h-screen">
      <ExerciseInterface
        config={currentConfig}
        devExercises={EXERCISES}
        devExerciseIndex={index}
        onDevSelectExercise={jumpTo}
      />

      {isTransitioning && (
        <ExerciseResultOverlay result={lastResult} onNext={advance} />
      )}
    </div>
  )
}
