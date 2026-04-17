import { Midi } from '@tonejs/midi'

/**
 * Parse a fingering code string into hand and finger components.
 * Returns null if the code is missing or malformed.
 *
 * @param {string|undefined} code - e.g. "L3", "R1"
 * @returns {{ hand: "left"|"right", finger: 1|2|3|4|5 } | null}
 */
export function parseFingeringCode(code) {
  if (!code || code.length < 2) return null
  const handChar = code[0].toUpperCase()
  const fingerNum = parseInt(code[1], 10)
  if ((handChar !== 'L' && handChar !== 'R') || fingerNum < 1 || fingerNum > 5) return null
  return {
    hand: handChar === 'L' ? 'left' : 'right',
    finger: fingerNum,
  }
}

/**
 * Parse a MIDI ArrayBuffer into the NoteEvent format used by ExerciseInterface.
 *
 * Time values from @tonejs/midi are in seconds; this function converts them to
 * beats using the tempo found in the file header.
 *
 * Hand assignment default: notes at or above handSplitPitch → right hand,
 * notes below → left hand. If a fingeringMap is provided, it overrides both
 * hand and finger for any pitch it covers.
 *
 * @param {ArrayBuffer} buffer
 * @param {{
 *   handSplitPitch?: number,
 *   fingeringMap?: import('./constants').FingeringMap
 * }} [options]
 * @returns {{ notes: import('./constants').NoteEvent[], detectedBpm: number }}
 */
export function parseMidi(buffer, options = {}) {
  const { handSplitPitch = 60, fingeringMap = {} } = options
  const hasCustomFingering = Object.keys(fingeringMap).length > 0

  const midi = new Midi(buffer)
  const detectedBpm = midi.header.tempos[0]?.bpm ?? 120
  const beatsPerSecond = detectedBpm / 60

  const notes = midi.tracks
    .flatMap((track) => track.notes)
    .map((n, i) => {
      const fingering = parseFingeringCode(fingeringMap[n.midi])

      // If a fingeringMap entry exists for this pitch, use its hand + finger.
      // Otherwise fall back to the pitch-split for hand and leave finger undefined.
      const hand = fingering ? fingering.hand : (n.midi >= handSplitPitch ? 'right' : 'left')
      const finger = fingering ? fingering.finger : undefined

      return {
        id: `midi-${i}`,
        pitch: n.midi,
        startTime: n.time * beatsPerSecond,
        duration: Math.max(n.duration * beatsPerSecond, 0.1),
        hand,
        finger,
      }
    })
    .sort((a, b) => a.startTime - b.startTime)

  return { notes, detectedBpm }
}
