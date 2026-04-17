import {
  generateKeys,
  blackKeyWidth,
  whiteKeyWidth,
} from '../../lib/pianoLayout.js'
import { KEYBOARD_HEIGHT_PX, KEYBOARD_START_OCTAVE, KEYBOARD_OCTAVES } from '../../lib/constants.js'

const BLACK_KEY_HEIGHT_PX = 90

/**
 * Full-width interactive piano keyboard.
 *
 * containerWidth is passed from ExerciseInterface so that this component and
 * FallingNotes always use an identical value — guaranteeing that falling tiles
 * land precisely on the correct key.
 *
 * Key visual states:
 *   expectedNotes → accent red   (guide: what to play next)
 *   pressedNotes  → grey         (user input via MIDI)
 *   both          → deep accent  (correct hit)
 *
 * @param {{
 *   containerWidth:  number,
 *   expectedNotes?:  number[],
 *   pressedNotes?:   Set<number>,
 *   startOctave?:    number,
 *   octaves?:        number,
 * }} props
 */
export function PianoKeyboard({
  containerWidth,
  expectedNotes = [],
  pressedNotes  = new Set(),
  startOctave   = KEYBOARD_START_OCTAVE,
  octaves       = KEYBOARD_OCTAVES,
}) {
  const wkw  = whiteKeyWidth(containerWidth, startOctave, octaves)
  const bkw  = blackKeyWidth(containerWidth, startOctave, octaves)
  const keys = containerWidth > 0 ? generateKeys(containerWidth, startOctave, octaves) : []

  const expectedSet = new Set(expectedNotes)

  return (
    <div className="relative w-full" style={S.keyboard}>
      {keys.map((key) => {
        const isExpected = expectedSet.has(key.midi)
        const isPressed  = pressedNotes.has(key.midi)
        const isBoth     = isExpected && isPressed

        if (key.isBlack) {
          const bg = isBoth ? '#c03820' : isPressed ? '#3a3a3a' : isExpected ? 'var(--color-accent)' : '#1a1a1a'
          return (
            <div
              key={key.midi}
              className="absolute top-0 rounded-b-sm"
              style={blackKeyStyle(key.x, bkw, bg)}
            />
          )
        }

        const bg = isBoth ? '#c03820' : isPressed ? '#c8c8c8' : isExpected ? 'var(--color-accent)' : '#fafafa'
        return (
          <div
            key={key.midi}
            className="absolute top-0 rounded-b-sm"
            style={whiteKeyStyle(key.x, wkw, bg, isExpected, isPressed)}
          />
        )
      })}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  keyboard: { height: KEYBOARD_HEIGHT_PX },
}

const blackKeyStyle = (x, width, bg) => ({
  left:            x,
  width:           width,
  height:          BLACK_KEY_HEIGHT_PX,
  backgroundColor: bg,
  boxShadow:       'inset 0 -2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)',
  zIndex:          2,
  transition:      'background-color 0.08s ease',
})

const whiteKeyStyle = (x, wkw, bg, isExpected, isPressed) => ({
  left:            x,
  width:           wkw - 1,
  height:          KEYBOARD_HEIGHT_PX,
  backgroundColor: bg,
  borderLeft:      '1px solid var(--color-border)',
  borderRight:     '1px solid var(--color-border)',
  boxShadow:       isExpected || isPressed
    ? 'inset 0 -4px 8px rgba(0,0,0,0.2)'
    : 'inset 0 -4px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
  zIndex:          1,
  transition:      'background-color 0.08s ease',
})
