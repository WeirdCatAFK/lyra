/**
 * noteQuantizer.js
 *
 * Converts beat-duration values into VexFlow notation descriptors.
 * All functions are pure — no VexFlow imports, no side effects.
 *
 * Beat conventions (4/4 time, quarter note = 1 beat):
 *   4.0  → whole note
 *   2.0  → half note
 *   1.0  → quarter note
 *   0.5  → eighth note
 *   0.25 → sixteenth note
 *   0.125→ thirty-second note
 *   1.5  → dotted quarter  (1.0 × 1.5)
 *   0.75 → dotted eighth   (0.5 × 1.5)
 *   etc.
 */

/**
 * All standard note values in descending beat order.
 * Each entry: { beats, vex, dots }
 *   beats — exact beat count this value represents
 *   vex   — VexFlow duration string ('w','h','q','8','16','32','64')
 *   dots  — number of augmentation dots
 */
export const NOTE_VALUES = [
  { beats: 4.0,    vex: 'w',  dots: 0 },
  { beats: 3.0,    vex: 'h',  dots: 1 },
  { beats: 2.0,    vex: 'h',  dots: 0 },
  { beats: 1.5,    vex: 'q',  dots: 1 },
  { beats: 1.0,    vex: 'q',  dots: 0 },
  { beats: 0.75,   vex: '8',  dots: 1 },
  { beats: 0.5,    vex: '8',  dots: 0 },
  { beats: 0.375,  vex: '16', dots: 1 },
  { beats: 0.25,   vex: '16', dots: 0 },
  { beats: 0.1875, vex: '32', dots: 1 },
  { beats: 0.125,  vex: '32', dots: 0 },
  { beats: 0.0625, vex: '64', dots: 0 },
]

const SNAP_TOLERANCE = 0.07  // beats — how close a duration must be to snap

/**
 * Round a beat-duration to the nearest standard note value.
 *
 * @param {number} beats
 * @returns {{ beats: number, vex: string, dots: number }}
 */
export function quantizeDuration(beats) {
  let best = NOTE_VALUES[NOTE_VALUES.length - 1]
  let bestDiff = Infinity

  for (const nv of NOTE_VALUES) {
    const diff = Math.abs(beats - nv.beats)
    if (diff < bestDiff) {
      bestDiff = diff
      best = nv
    }
    if (diff < SNAP_TOLERANCE) break  // sorted descending; once close enough, stop
  }

  return best
}

/**
 * Decompose a beat gap into the fewest possible standard rest values.
 * Uses a greedy largest-first approach.
 *
 * @param {number} beats
 * @returns {Array<{ vex: string, dots: number }>}
 */
export function beatsToRests(beats) {
  const rests = []
  let remaining = beats

  for (const nv of NOTE_VALUES) {
    while (remaining >= nv.beats - SNAP_TOLERANCE) {
      rests.push({ vex: nv.vex, dots: nv.dots })
      remaining -= nv.beats
      if (remaining < SNAP_TOLERANCE) break
    }
    if (remaining < SNAP_TOLERANCE) break
  }

  return rests
}

// ─── Pitch → VexFlow key ────────────────────────────────────────────────────

/**
 * Diatonic note name for each semitone in an octave (0–11).
 * Black keys share the diatonic name of the note below (C# → c).
 */
const DIATONIC = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b']

/** Accidental symbol for each semitone, or null for naturals. */
const ACCIDENTALS = [null, '#', null, '#', null, null, '#', null, '#', null, '#', null]

/**
 * Convert a MIDI pitch to a VexFlow key string and optional accidental.
 *
 * VexFlow key format: `"c/4"` for middle C (MIDI 60).
 *
 * @param {number} pitch  MIDI pitch 0–127
 * @returns {{ key: string, accidental: string|null }}
 *
 * @example
 * midiToVexKey(60)  // { key: 'c/4',  accidental: null }
 * midiToVexKey(61)  // { key: 'c/4',  accidental: '#'  }   (C#4 written on C line + sharp)
 * midiToVexKey(69)  // { key: 'a/4',  accidental: null }
 */
export function midiToVexKey(pitch) {
  const noteInOctave = pitch % 12
  const octave       = Math.floor(pitch / 12) - 1
  return {
    key:         `${DIATONIC[noteInOctave]}/${octave}`,
    accidental:  ACCIDENTALS[noteInOctave],
  }
}

/**
 * Group an array of NoteEvents by startTime, merging simultaneous notes
 * on the same hand into chords. Returns chord objects sorted by startTime.
 *
 * @param {import('./constants').NoteEvent[]} notes
 * @param {number} measureStart  - beat where this measure begins
 * @param {number} measureEnd    - beat where this measure ends
 * @returns {Array<{ startTime: number, pitches: number[], duration: number }>}
 */
export function groupIntoChords(notes, measureStart, measureEnd) {
  const inMeasure = notes
    .filter((n) => n.startTime >= measureStart - 0.05 && n.startTime < measureEnd - 0.05)
    .sort((a, b) => a.startTime - b.startTime)

  const chords = []
  for (const note of inMeasure) {
    const existing = chords.find((c) => Math.abs(c.startTime - note.startTime) < 0.05)
    if (existing) {
      existing.pitches.push(note.pitch)
      existing.duration = Math.max(existing.duration, note.duration)
    } else {
      chords.push({ startTime: note.startTime, pitches: [note.pitch], duration: note.duration })
    }
  }

  return chords
}
