/**
 * Piano layout utilities shared by PianoKeyboard and FallingNotes.
 *
 * Both components must use these functions to guarantee that falling note
 * tiles land on exactly the right key regardless of container width or octave range.
 */

const WHITE_NOTES_IN_OCTAVE = [0, 2, 4, 5, 7, 9, 11] // C D E F G A B
const BLACK_NOTES_IN_OCTAVE = [1, 3, 6, 8, 10]        // C# D# F# G# A#

/**
 * For black keys: the index of the white-key junction they sit above.
 * e.g. C# (1) sits between C (white index 0) and D (white index 1) → junction 1.
 */
const BLACK_KEY_JUNCTION = {
  1:  1,  // C#
  3:  2,  // D#
  6:  4,  // F#
  8:  5,  // G#
  10: 6,  // A#
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/**
 * Returns the note name (e.g. "C♯", "D") for a MIDI pitch, without octave.
 * @param {number} pitch
 * @returns {string}
 */
export function pitchToNoteName(pitch) {
  return NOTE_NAMES[pitch % 12]
}

/**
 * Returns true if the given MIDI pitch corresponds to a black (sharp/flat) key.
 * @param {number} pitch
 * @returns {boolean}
 */
export function isBlackKey(pitch) {
  return BLACK_NOTES_IN_OCTAVE.includes(pitch % 12)
}

/**
 * Width in pixels of one white key.
 * @param {number} containerWidth
 * @param {number} startOctave
 * @param {number} octaves
 * @returns {number}
 */
export function whiteKeyWidth(containerWidth, startOctave, octaves) {
  const totalWhiteKeys = octaves * WHITE_NOTES_IN_OCTAVE.length
  return containerWidth / totalWhiteKeys
}

/**
 * Width in pixels of one black key.
 * @param {number} containerWidth
 * @param {number} startOctave
 * @param {number} octaves
 * @returns {number}
 */
export function blackKeyWidth(containerWidth, startOctave, octaves) {
  return whiteKeyWidth(containerWidth, startOctave, octaves) * 0.6
}

/**
 * Returns the left-edge x-coordinate (in pixels) of the given MIDI pitch
 * within a container of containerWidth, starting at startOctave.
 *
 * For black keys this is the left edge of the black key rectangle.
 * For white keys this is the left edge of the white key rectangle.
 *
 * @param {number} pitch
 * @param {number} containerWidth
 * @param {number} startOctave
 * @param {number} octaves
 * @returns {number}
 */
export function noteToX(pitch, containerWidth, startOctave, octaves) {
  const wkw = whiteKeyWidth(containerWidth, startOctave, octaves)
  const bkw = blackKeyWidth(containerWidth, startOctave, octaves)
  const noteInOctave = pitch % 12
  const midiOctave = Math.floor(pitch / 12) - 1
  const octaveIndex = midiOctave - startOctave

  // Clamp notes outside the visible range to the nearest edge
  if (octaveIndex < 0) return 0
  if (octaveIndex >= octaves) return containerWidth - wkw

  const whiteKeysPerOctave = WHITE_NOTES_IN_OCTAVE.length

  if (BLACK_NOTES_IN_OCTAVE.includes(noteInOctave)) {
    const junctionIndex = BLACK_KEY_JUNCTION[noteInOctave]
    return (octaveIndex * whiteKeysPerOctave + junctionIndex) * wkw - bkw / 2
  } else {
    const whiteIndex = WHITE_NOTES_IN_OCTAVE.indexOf(noteInOctave)
    return (octaveIndex * whiteKeysPerOctave + whiteIndex) * wkw
  }
}

/**
 * Generates a flat list of all keys (white and black) for the given range,
 * sorted so white keys come first (rendered underneath), then black keys.
 *
 * Each key: { midi, isBlack, x }
 *
 * @param {number} containerWidth
 * @param {number} startOctave
 * @param {number} octaves
 * @returns {{ midi: number, isBlack: boolean, x: number }[]}
 */
export function generateKeys(containerWidth, startOctave, octaves) {
  const keys = []

  for (let o = 0; o < octaves; o++) {
    const midiOctave = startOctave + o
    const baseNote = (midiOctave + 1) * 12

    // White keys
    WHITE_NOTES_IN_OCTAVE.forEach((note) => {
      keys.push({
        midi: baseNote + note,
        isBlack: false,
        x: noteToX(baseNote + note, containerWidth, startOctave, octaves),
      })
    })

    // Black keys
    BLACK_NOTES_IN_OCTAVE.forEach((note) => {
      keys.push({
        midi: baseNote + note,
        isBlack: true,
        x: noteToX(baseNote + note, containerWidth, startOctave, octaves),
      })
    })
  }

  // White keys first so black keys render on top
  return keys.sort((a, b) => {
    if (a.isBlack === b.isBlack) return a.x - b.x
    return a.isBlack ? 1 : -1
  })
}
