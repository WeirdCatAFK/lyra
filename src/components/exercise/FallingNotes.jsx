import { useRef } from 'react'
import { useContainerSize } from '../../hooks/useContainerSize.js'
import {
  noteToX,
  isBlackKey,
  whiteKeyWidth,
  blackKeyWidth,
  pitchToNoteName,
} from '../../lib/pianoLayout.js'
import { parseFingeringCode } from '../../lib/midiParser.js'
import {
  BEATS_TO_FALL,
  KEYBOARD_START_OCTAVE,
  KEYBOARD_OCTAVES,
  scaffoldAtLeast,
} from '../../lib/constants.js'

const HAND_COLORS = {
  right: 'rgba(217, 74, 44, 0.75)',
  left:  'rgba(122, 158, 159, 0.75)',
}
const NEUTRAL_COLOR = 'rgba(130, 120, 110, 0.72)'

/**
 * Synthesia-style falling note tiles.
 *
 * Scaffold levels control visual richness:
 *   bare/position — neutral color, no labels
 *   label         — neutral color + note name on tile
 *   color         — hand-color coding, no label
 *   full          — hand colors + finger number label (default)
 *
 * @param {{
 *   notes:               import('../lib/constants').NoteEvent[],
 *   currentBeat:         number,
 *   containerWidth:      number,
 *   scoreBottom:         number,
 *   activeFingeringMap?: Object.<number, string>,
 *   hasCustomFingering?: boolean,
 *   scaffold?:           string,
 *   startOctave?:        number,
 *   octaves?:            number,
 * }} props
 */
export function FallingNotes({
  notes,
  currentBeat,
  containerWidth,
  scoreBottom,
  activeFingeringMap = {},
  hasCustomFingering = false,
  scaffold     = 'full',
  startOctave  = KEYBOARD_START_OCTAVE,
  octaves      = KEYBOARD_OCTAVES,
}) {
  const heightRef = useRef(null)
  const { ref: sizeRef, height: measuredHeight } = useContainerSize()

  const setRef = (el) => {
    heightRef.current = el
    sizeRef.current   = el
  }

  const laneHeight    = measuredHeight || 400
  const pixelsPerBeat = laneHeight / BEATS_TO_FALL
  const wkw = whiteKeyWidth(containerWidth, startOctave, octaves)
  const bkw = blackKeyWidth(containerWidth, startOctave, octaves)

  const showColor  = scaffoldAtLeast(scaffold, 'color')
  const showLabel  = scaffoldAtLeast(scaffold, 'label')
  const showFinger = scaffoldAtLeast(scaffold, 'full')

  return (
    <div ref={setRef} className="absolute inset-0 overflow-hidden pointer-events-none" style={laneStyle(scoreBottom)}>
      {containerWidth > 0 && notes.map((note) => {
        const beatsUntilHit = note.startTime - currentBeat
        const noteHeight    = Math.max(note.duration * pixelsPerBeat, 20)
        const yBottom       = (BEATS_TO_FALL - beatsUntilHit) * pixelsPerBeat
        const yPos          = yBottom - noteHeight

        if (yBottom < 0 || yPos > laneHeight) return null

        const black     = isBlackKey(note.pitch)
        const xPos      = noteToX(note.pitch, containerWidth, startOctave, octaves)
        const noteWidth = black ? bkw : wkw * 0.85
        const centeredX = black ? xPos : xPos + (wkw - noteWidth) / 2

        let hand = note.hand
        if (hasCustomFingering && activeFingeringMap[note.pitch]) {
          hand = activeFingeringMap[note.pitch][0].toLowerCase() === 'l' ? 'left' : 'right'
        }

        const tileColor = showColor
          ? (HAND_COLORS[hand] ?? HAND_COLORS.right)
          : NEUTRAL_COLOR

        let labelText = null
        if (showFinger && activeFingeringMap[note.pitch]) {
          const parsed = parseFingeringCode(activeFingeringMap[note.pitch])
          if (parsed) labelText = String(parsed.finger)
        } else if (showLabel) {
          labelText = pitchToNoteName(note.pitch)
        }

        const fontSize = Math.max(Math.min(noteWidth * 0.5, 13), 8)

        return (
          <div
            key={note.id}
            className="absolute rounded-sm overflow-hidden flex items-end justify-center"
            style={tileStyle(centeredX, yPos, noteWidth, noteHeight, tileColor, labelText)}
          >
            {labelText && (
              <span style={tileLabelStyle(fontSize)}>{labelText}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const laneStyle = (scoreBottom) => ({
  maskImage: `linear-gradient(to bottom,
    transparent 0%,
    transparent ${scoreBottom * 0.3}px,
    rgba(0,0,0,0.3) ${scoreBottom * 0.6}px,
    rgba(0,0,0,0.7) ${scoreBottom}px,
    black ${scoreBottom + 20}px,
    black 100%)`,
  WebkitMaskImage: `linear-gradient(to bottom,
    transparent 0%,
    transparent ${scoreBottom * 0.3}px,
    rgba(0,0,0,0.3) ${scoreBottom * 0.6}px,
    rgba(0,0,0,0.7) ${scoreBottom}px,
    black ${scoreBottom + 20}px,
    black 100%)`,
})

const tileStyle = (x, y, width, height, color, labelText) => ({
  left:            x,
  top:             y,
  width:           width,
  height:          height,
  backgroundColor: color,
  boxShadow:       '0 1px 2px rgba(0,0,0,0.1)',
  paddingBottom:   labelText ? 2 : 0,
})

const tileLabelStyle = (fontSize) => ({
  fontSize,
  color:      'rgba(255,255,255,0.92)',
  fontWeight: 700,
  lineHeight:  1,
  userSelect: 'none',
})
