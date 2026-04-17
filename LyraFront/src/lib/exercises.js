import { pitchToNoteName } from './pianoLayout.js'
import { TIMING_TOLERANCE_BEATS } from './constants.js'

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

function logResult(result) {
  console.group('Exercise complete — %s', result.exerciseId)
  result.metrics.forEach((m) => console.log('%s  %s', m.label.padEnd(20), m.value.toFixed(3)))
  console.groupEnd()
}

const EXERCISE_BEGINNER = {
  id: 'beginner-c-major', bpm: 72, scaffold: 'full',
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
  fingeringMap: { 60: 'R1', 62: 'R2', 64: 'R3', 65: 'R4', 67: 'R1', 69: 'R2', 71: 'R3', 72: 'R4', 48: 'L5', 43: 'L5' },
  aiCommentaryLines: ['Play each note with a relaxed, curved hand.', 'Let the thumb pass under smoothly on the scale.'],
  exerciseInstruction: 'C major scale — right hand, one octave.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.3, compute: computeTiming },
  ],
  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (expected.length === 0) return 'Wait for the next note...'
    if (!expected.includes(pitch)) return `Expected ${expected.map(pitchToNoteName).join(', ')}`
    return null
  },
  onComplete: logResult,
}

const EXERCISE_INTERMEDIATE = {
  id: 'intermediate-chromatic', bpm: 84, scaffold: 'color',
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
  fingeringMap: { 60: 'R1', 61: 'R2', 62: 'R3', 63: 'R1', 64: 'R2', 65: 'R3', 66: 'R4', 67: 'R5', 48: 'L5', 46: 'L5' },
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
  onComplete: logResult,
}

const EXERCISE_LABEL_SCAFFOLD = {
  id: 'label-a-minor', bpm: 76, scaffold: 'label', panels: { rightHand: false },
  notes: [
    { id: 'r1', pitch: 69, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 71, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 72, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 74, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 76, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 77, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 79, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 81, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 45, startTime: 0, duration: 4, hand: 'left' },
    { id: 'l2', pitch: 40, startTime: 4, duration: 4, hand: 'left' },
  ],
  aiCommentaryLines: ['Note names are shown on each tile — read them as you play.', 'Right hand diagram is hidden for this exercise.'],
  exerciseInstruction: 'A natural minor scale — note names visible.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.4, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],
  onComplete: logResult,
}

const EXERCISE_POSITION_SCAFFOLD = {
  id: 'position-g-major', bpm: 80, scaffold: 'position',
  notes: [
    { id: 'r1', pitch: 67, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 69, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 71, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 72, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 74, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 76, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 78, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 79, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 43, startTime: 0, duration: 4, hand: 'left' },
    { id: 'l2', pitch: 38, startTime: 4, duration: 4, hand: 'left' },
  ],
  aiCommentaryLines: ['Only the keyboard highlights guide you — tiles show no colour or label.', 'Watch the keys light up ahead of each note.'],
  exerciseInstruction: 'G major scale — keyboard guide only.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],
  onComplete: logResult,
}

const EXERCISE_WALTZ = {
  id: 'waltz-3-4', bpm: 66, scaffold: 'color', beatsPerMeasure: 3,
  notes: [
    { id: 'r1', pitch: 64, startTime: 0,   duration: 1,   hand: 'right' },
    { id: 'r2', pitch: 67, startTime: 1,   duration: 0.5, hand: 'right' },
    { id: 'r3', pitch: 69, startTime: 1.5, duration: 0.5, hand: 'right' },
    { id: 'r4', pitch: 71, startTime: 2,   duration: 1,   hand: 'right' },
    { id: 'r5', pitch: 72, startTime: 3,   duration: 1.5, hand: 'right' },
    { id: 'r6', pitch: 71, startTime: 4.5, duration: 0.5, hand: 'right' },
    { id: 'r7', pitch: 69, startTime: 5,   duration: 1,   hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0,   duration: 1,   hand: 'left' },
    { id: 'l2', pitch: 52, startTime: 1,   duration: 1,   hand: 'left' },
    { id: 'l3', pitch: 55, startTime: 2,   duration: 1,   hand: 'left' },
    { id: 'l4', pitch: 43, startTime: 3,   duration: 1,   hand: 'left' },
    { id: 'l5', pitch: 47, startTime: 4,   duration: 1,   hand: 'left' },
    { id: 'l6', pitch: 50, startTime: 5,   duration: 1,   hand: 'left' },
  ],
  fingeringMap: { 64: 'R3', 67: 'R2', 69: 'R1', 71: 'R2', 72: 'R1', 48: 'L5', 52: 'L3', 55: 'L1', 43: 'L5', 47: 'L3', 50: 'L1' },
  aiCommentaryLines: ['Feel the waltz pulse: strong beat ONE, lighter beats two and three.', 'Left hand plays root–chord–chord each measure.'],
  exerciseInstruction: 'Waltz in C — 3/4 time.',
  metrics: [
    { label: 'rhythm',         difficulty: 0.6, compute: computeRhythm },
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
  ],
  onComplete: logResult,
}

const EXERCISE_CHORDS = {
  id: 'chords-progression', bpm: 60, scaffold: 'full',
  notes: [
    { id: 'c1a', pitch: 60, startTime: 0,   duration: 1.5, hand: 'right' },
    { id: 'c1b', pitch: 64, startTime: 0,   duration: 1.5, hand: 'right' },
    { id: 'c1c', pitch: 67, startTime: 0,   duration: 1.5, hand: 'right' },
    { id: 'c2a', pitch: 69, startTime: 1.5, duration: 1.5, hand: 'right' },
    { id: 'c2b', pitch: 72, startTime: 1.5, duration: 1.5, hand: 'right' },
    { id: 'c2c', pitch: 76, startTime: 1.5, duration: 1.5, hand: 'right' },
    { id: 'c3a', pitch: 65, startTime: 3,   duration: 1.5, hand: 'right' },
    { id: 'c3b', pitch: 69, startTime: 3,   duration: 1.5, hand: 'right' },
    { id: 'c3c', pitch: 72, startTime: 3,   duration: 1.5, hand: 'right' },
    { id: 'c4a', pitch: 67, startTime: 4.5, duration: 1.5, hand: 'right' },
    { id: 'c4b', pitch: 71, startTime: 4.5, duration: 1.5, hand: 'right' },
    { id: 'c4c', pitch: 74, startTime: 4.5, duration: 1.5, hand: 'right' },
    { id: 'lb1', pitch: 48, startTime: 0,   duration: 3,   hand: 'left' },
    { id: 'lb2', pitch: 53, startTime: 3,   duration: 3,   hand: 'left' },
  ],
  fingeringMap: { 60: 'R1', 64: 'R2', 67: 'R3', 69: 'R1', 72: 'R2', 76: 'R3', 65: 'R1', 71: 'R2', 74: 'R3', 48: 'L5', 53: 'L5' },
  aiCommentaryLines: ['Press all three notes of each chord together.', 'Keep the wrist relaxed — let the arm weight do the work.'],
  exerciseInstruction: 'C — Am — F — G chord progression.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],
  onComplete: logResult,
}

const EXERCISE_FINGERING_CHANGES = {
  id: 'fingering-crossover', bpm: 72, scaffold: 'full', panels: { devLog: true },
  notes: [
    { id: 'r1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 62, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 64, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 60, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 62, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 64, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 65, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0, duration: 8, hand: 'left' },
  ],
  fingeringMap: { 60: 'R1', 62: 'R2', 64: 'R3', 65: 'R4', 48: 'L5' },
  fingeringChanges: [{ beat: 4, map: { 60: 'R2', 62: 'R3', 64: 'R4', 65: 'R5' } }],
  aiCommentaryLines: ['Watch the finger numbers change at beat 4 — the thumb crosses under.', 'Dev log panel is visible to trace the fingeringChanges event.'],
  exerciseInstruction: 'C–D–E–F twice with a fingering crossover at the repeat.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.4, compute: computeTiming },
  ],
  onComplete: logResult,
}

const EXERCISE_BARE = {
  id: 'bare-sight-reading', bpm: 100, scaffold: 'bare',
  panels: { leftHand: false, rightHand: false, metronome: false },
  notes: [
    { id: 'r1', pitch: 64, startTime: 0,   duration: 1,   hand: 'right' },
    { id: 'r2', pitch: 67, startTime: 1,   duration: 1.5, hand: 'right' },
    { id: 'r3', pitch: 69, startTime: 2.5, duration: 0.5, hand: 'right' },
    { id: 'r4', pitch: 71, startTime: 3,   duration: 1,   hand: 'right' },
    { id: 'r5', pitch: 72, startTime: 4,   duration: 2,   hand: 'right' },
    { id: 'r6', pitch: 71, startTime: 6,   duration: 0.5, hand: 'right' },
    { id: 'r7', pitch: 69, startTime: 6.5, duration: 0.5, hand: 'right' },
    { id: 'r8', pitch: 67, startTime: 7,   duration: 1,   hand: 'right' },
    { id: 'l1', pitch: 52, startTime: 0,   duration: 2,   hand: 'left' },
    { id: 'l2', pitch: 55, startTime: 2,   duration: 2,   hand: 'left' },
    { id: 'l3', pitch: 57, startTime: 4,   duration: 4,   hand: 'left' },
  ],
  aiCommentaryLines: ['No visual guides — read the score and listen.', 'Hand diagrams and metronome are hidden.'],
  exerciseInstruction: 'Bare scaffold: score and falling tiles only.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.8, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.8, compute: computeTiming },
    { label: 'rhythm',         difficulty: 0.7, compute: computeRhythm },
  ],
  onComplete: logResult,
}

const EXERCISE_STEP_SCALE = {
  id: 'step-d-major', bpm: 72, mode: 'step', scaffold: 'full', panels: { metronome: false },
  notes: [
    { id: 'r1', pitch: 62, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 64, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 66, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 67, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 69, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 71, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 73, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 74, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 50, startTime: 0, duration: 4, hand: 'left' },
    { id: 'l2', pitch: 45, startTime: 4, duration: 4, hand: 'left' },
  ],
  fingeringMap: { 62: 'R1', 64: 'R2', 66: 'R3', 67: 'R4', 69: 'R1', 71: 'R2', 73: 'R3', 74: 'R4', 50: 'L5', 45: 'L5' },
  aiCommentaryLines: ['Press the highlighted key — the exercise waits for you.', 'There is no tempo: take as long as you need.'],
  exerciseInstruction: 'D major scale — step mode.',
  metrics: [{ label: 'pitch_accuracy', difficulty: 0.3, compute: computeStepPrecision }],
  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (expected.length > 0 && !expected.includes(pitch)) return 'Wrong note — try again'
    return null
  },
  onComplete: logResult,
}

const EXERCISE_STEP_CHORDS = {
  id: 'step-triads', bpm: 60, mode: 'step', scaffold: 'full', panels: { metronome: false },
  notes: [
    { id: 'c1a', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'c1b', pitch: 64, startTime: 0, duration: 1, hand: 'right' },
    { id: 'c1c', pitch: 67, startTime: 0, duration: 1, hand: 'right' },
    { id: 'c2a', pitch: 67, startTime: 1, duration: 1, hand: 'right' },
    { id: 'c2b', pitch: 71, startTime: 1, duration: 1, hand: 'right' },
    { id: 'c2c', pitch: 74, startTime: 1, duration: 1, hand: 'right' },
    { id: 'c3a', pitch: 69, startTime: 2, duration: 1, hand: 'right' },
    { id: 'c3b', pitch: 72, startTime: 2, duration: 1, hand: 'right' },
    { id: 'c3c', pitch: 76, startTime: 2, duration: 1, hand: 'right' },
    { id: 'c4a', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
    { id: 'c4b', pitch: 69, startTime: 3, duration: 1, hand: 'right' },
    { id: 'c4c', pitch: 72, startTime: 3, duration: 1, hand: 'right' },
    { id: 'l1',  pitch: 48, startTime: 0, duration: 2, hand: 'left' },
    { id: 'l2',  pitch: 41, startTime: 2, duration: 2, hand: 'left' },
  ],
  fingeringMap: { 60: 'R1', 64: 'R2', 67: 'R3', 71: 'R2', 74: 'R3', 69: 'R1', 72: 'R2', 76: 'R3', 65: 'R1', 48: 'L5', 41: 'L5' },
  aiCommentaryLines: ['Press ALL three notes of each chord before the next chord appears.', 'Partial hits do not advance — the chord waits until complete.'],
  exerciseInstruction: 'C — G — Am — F  step mode.',
  metrics: [{ label: 'pitch_accuracy', difficulty: 0.5, compute: computeStepPrecision }],
  onComplete: logResult,
}

const EXERCISE_SCORE_ONLY = {
  id: 'score-only-pentatonic', bpm: 80, scaffold: 'position', panels: { fallingNotes: false },
  notes: [
    { id: 'r1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'r2', pitch: 64, startTime: 1, duration: 1, hand: 'right' },
    { id: 'r3', pitch: 67, startTime: 2, duration: 1, hand: 'right' },
    { id: 'r4', pitch: 69, startTime: 3, duration: 1, hand: 'right' },
    { id: 'r5', pitch: 72, startTime: 4, duration: 1, hand: 'right' },
    { id: 'r6', pitch: 69, startTime: 5, duration: 1, hand: 'right' },
    { id: 'r7', pitch: 67, startTime: 6, duration: 1, hand: 'right' },
    { id: 'r8', pitch: 64, startTime: 7, duration: 1, hand: 'right' },
    { id: 'l1', pitch: 48, startTime: 0, duration: 4, hand: 'left' },
    { id: 'l2', pitch: 43, startTime: 4, duration: 4, hand: 'left' },
  ],
  aiCommentaryLines: ['No falling tiles — read the score and watch the keyboard.', 'The playhead and lit keys are your only real-time guides.'],
  exerciseInstruction: 'C pentatonic — score and keyboard only.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],
  onComplete: logResult,
}

const EXERCISE_SCORE_BARE = {
  id: 'score-bare-reading', bpm: 84, scaffold: 'bare',
  panels: { fallingNotes: false, leftHand: false, rightHand: false },
  notes: [
    { id: 'r1', pitch: 64, startTime: 0,   duration: 1,   hand: 'right' },
    { id: 'r2', pitch: 66, startTime: 1,   duration: 0.5, hand: 'right' },
    { id: 'r3', pitch: 67, startTime: 1.5, duration: 0.5, hand: 'right' },
    { id: 'r4', pitch: 69, startTime: 2,   duration: 1,   hand: 'right' },
    { id: 'r5', pitch: 71, startTime: 3,   duration: 2,   hand: 'right' },
    { id: 'r6', pitch: 69, startTime: 5,   duration: 0.5, hand: 'right' },
    { id: 'r7', pitch: 67, startTime: 5.5, duration: 0.5, hand: 'right' },
    { id: 'r8', pitch: 64, startTime: 6,   duration: 2,   hand: 'right' },
    { id: 'l1', pitch: 52, startTime: 0,   duration: 2,   hand: 'left' },
    { id: 'l2', pitch: 57, startTime: 2,   duration: 2,   hand: 'left' },
    { id: 'l3', pitch: 59, startTime: 4,   duration: 4,   hand: 'left' },
  ],
  aiCommentaryLines: ['Score reading only — no keyboard highlights, no falling tiles.', 'Hand diagrams are hidden. Trust the score.'],
  exerciseInstruction: 'E minor melody — bare score reading.',
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.7, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.7, compute: computeTiming },
    { label: 'rhythm',         difficulty: 0.6, compute: computeRhythm },
  ],
  onComplete: logResult,
}

export const EXERCISES = [
  EXERCISE_BEGINNER,
  EXERCISE_INTERMEDIATE,
  EXERCISE_LABEL_SCAFFOLD,
  EXERCISE_POSITION_SCAFFOLD,
  EXERCISE_WALTZ,
  EXERCISE_CHORDS,
  EXERCISE_FINGERING_CHANGES,
  EXERCISE_BARE,
  EXERCISE_STEP_SCALE,
  EXERCISE_STEP_CHORDS,
  EXERCISE_SCORE_ONLY,
  EXERCISE_SCORE_BARE,
]
