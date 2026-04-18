import { useEffect, useRef, useState } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  Accidental,
  Dot,
  StaveConnector,
  Annotation,
} from 'vexflow'
import {
  quantizeDuration,
  beatsToRests,
  midiToVexKey,
  groupIntoChords,
} from '../../lib/noteQuantizer.js'
import { SCORE_HEIGHT_PX } from '../../lib/constants.js'

// ─── Layout constants ────────────────────────────────────────────────────────

const STAVE_TOP_MARGIN   = 18
const STAFF_LINE_SPACING = 10
const STAFF_HEIGHT       = STAFF_LINE_SPACING * 4
const STAFF_GAP          = 56
const BASS_Y             = STAVE_TOP_MARGIN + STAFF_HEIGHT + STAFF_GAP

const ACCENT_COLOR  = '#ff5fa2'
const NEUTRAL_COLOR = '#1a1a1a'

// ─── Core render function ────────────────────────────────────────────────────

/**
 * Renders the grand staff for `currentMeasure` and `currentMeasure + 1` into
 * `container` using VexFlow. Returns layout metadata used to position the
 * React playhead overlay without a full re-render.
 *
 * @returns {{ noteStartX: number, noteEndX: number, containerWidth: number }}
 */
function renderScore({ container, notes, currentMeasure, beatsPerMeasure, fingeringMap, activePitches, scoreHeight }) {
  container.innerHTML = ''

  const containerWidth = container.clientWidth
  if (!containerWidth) return null

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(containerWidth, scoreHeight)
  const ctx = renderer.getContext()

  const SIDE_MARGIN    = 12
  const usableWidth    = containerWidth - SIDE_MARGIN * 2
  const FIRST_PREFIX   = 90
  const measureWidth   = (usableWidth - FIRST_PREFIX) / 2

  let layoutMeta = null

  for (let slot = 0; slot < 2; slot++) {
    const measureNum   = currentMeasure + slot
    const measureStart = measureNum * beatsPerMeasure
    const measureEnd   = measureStart + beatsPerMeasure
    const isFirst      = slot === 0

    const staveX     = SIDE_MARGIN + (isFirst ? 0 : FIRST_PREFIX + measureWidth)
    const staveWidth = isFirst ? FIRST_PREFIX + measureWidth : measureWidth

    const staveTreble = new Stave(staveX, STAVE_TOP_MARGIN, staveWidth)
    const staveBass   = new Stave(staveX, BASS_Y, staveWidth)

    if (isFirst) {
      staveTreble.addClef('treble').addTimeSignature(`${beatsPerMeasure}/4`)
      staveBass.addClef('bass').addTimeSignature(`${beatsPerMeasure}/4`)
    }

    staveTreble.setContext(ctx).draw()
    staveBass.setContext(ctx).draw()

    if (isFirst) {
      new StaveConnector(staveTreble, staveBass).setType('brace').setContext(ctx).draw()
      new StaveConnector(staveTreble, staveBass).setType('singleLeft').setContext(ctx).draw()
    }
    new StaveConnector(staveTreble, staveBass).setType('singleRight').setContext(ctx).draw()

    const measureNotes  = notes.filter((n) => n.startTime >= measureStart - 0.05 && n.startTime < measureEnd - 0.05)
    const trebleChords  = groupIntoChords(measureNotes.filter((n) => n.hand === 'right'), measureStart, measureEnd)
    const bassChords    = groupIntoChords(measureNotes.filter((n) => n.hand === 'left'),  measureStart, measureEnd)

    const trebleVexNotes = buildVexNotes(trebleChords, measureStart, measureEnd, fingeringMap, activePitches, 'treble')
    const bassVexNotes   = buildVexNotes(bassChords,   measureStart, measureEnd, fingeringMap, activePitches, 'bass')

    const trebleVoice = new Voice({ numBeats: beatsPerMeasure, beatValue: 4 }).setMode(Voice.Mode.SOFT)
    trebleVoice.addTickables(trebleVexNotes)

    const bassVoice = new Voice({ numBeats: beatsPerMeasure, beatValue: 4 }).setMode(Voice.Mode.SOFT)
    bassVoice.addTickables(bassVexNotes)

    const formattableWidth = staveWidth - (staveTreble.getNoteStartX() - staveTreble.getX()) - 10
    try {
      new Formatter()
        .joinVoices([trebleVoice])
        .joinVoices([bassVoice])
        .format([trebleVoice, bassVoice], formattableWidth)
    } catch {
      try { new Formatter().joinVoices([trebleVoice]).format([trebleVoice], formattableWidth) } catch {}
      try { new Formatter().joinVoices([bassVoice]).format([bassVoice], formattableWidth)   } catch {}
    }

    trebleVoice.draw(ctx, staveTreble)
    bassVoice.draw(ctx, staveBass)

    const pitchedTreble = trebleVexNotes.filter((n) => !n.isRest())
    const pitchedBass   = bassVexNotes.filter((n) => !n.isRest())

    Beam.generateBeams(pitchedTreble).forEach((b) => b.setContext(ctx).draw())
    Beam.generateBeams(pitchedBass).forEach((b) => b.setContext(ctx).draw())

    if (isFirst) {
      const noteStartX = staveTreble.getNoteStartX()
      const noteEndX   = staveTreble.getX() + staveTreble.getWidth()
      layoutMeta = { noteStartX, noteEndX, containerWidth }
    }
  }

  return layoutMeta
}

// ─── Build VexFlow note array for one voice ──────────────────────────────────

/**
 * Converts an array of chord groups into a complete, rest-filled array of
 * VexFlow StaveNote objects that exactly fills the measure duration.
 *
 * @param {Array<{ startTime: number, pitches: number[], duration: number }>} chords
 * @param {number} measureStart
 * @param {number} measureEnd
 * @param {Object} fingeringMap
 * @param {Set<number>} activePitches
 * @param {'treble'|'bass'} clef
 * @returns {StaveNote[]}
 */
function buildVexNotes(chords, measureStart, measureEnd, fingeringMap, activePitches, clef) {
  const vexNotes    = []
  const restKey     = clef === 'treble' ? 'b/4' : 'd/3'
  const beatsPerMeasure = measureEnd - measureStart
  let currentTime   = measureStart

  for (const chord of chords) {
    const gap = chord.startTime - currentTime
    if (gap > 0.06) {
      for (const r of beatsToRests(gap)) {
        vexNotes.push(makeRest(restKey, r.vex, r.dots))
      }
    }

    const qd      = quantizeDuration(chord.duration)
    const isActive = chord.pitches.some((p) => activePitches.has(p))

    const sortedPitches = [...chord.pitches].sort((a, b) => a - b)
    const keys          = sortedPitches.map((p) => midiToVexKey(p).key)

    const staveNote = new StaveNote({
      keys,
      duration:  qd.vex,
      clef,
      auto_stem: true,
    })

    sortedPitches.forEach((pitch, i) => {
      const { accidental } = midiToVexKey(pitch)
      if (accidental) staveNote.addModifier(new Accidental(accidental), i)
    })

    for (let d = 0; d < qd.dots; d++) staveNote.addModifier(new Dot(), 0)

    if (isActive) {
      staveNote.setStyle({ fillStyle: ACCENT_COLOR, strokeStyle: ACCENT_COLOR })
    }

    if (chord.pitches.length === 1) {
      const code = fingeringMap[chord.pitches[0]]
      if (code) {
        const finger = code[1]
        staveNote.addModifier(
          new Annotation(finger)
            .setFont('Arial', 12, 'italic')
            .setVerticalJustification(Annotation.VerticalJustify.TOP),
          0
        )
      }
    }

    vexNotes.push(staveNote)
    currentTime = chord.startTime + qd.beats
  }

  const remaining = measureEnd - currentTime
  if (remaining > 0.06) {
    for (const r of beatsToRests(remaining)) {
      vexNotes.push(makeRest(restKey, r.vex, r.dots))
    }
  }

  if (vexNotes.length === 0) {
    vexNotes.push(makeRest(restKey, 'w', 0))
  }

  return vexNotes
}

/** Create a VexFlow rest StaveNote. */
function makeRest(key, vex, dots) {
  const note = new StaveNote({ keys: [key], duration: `${vex}r` })
  note.setStyle({ fillStyle: '#999', strokeStyle: '#999' })
  for (let d = 0; d < dots; d++) note.addModifier(new Dot(), 0)
  return note
}

// ─── React component ─────────────────────────────────────────────────────────

/**
 * Grand staff (treble + bass) rendered with VexFlow.
 *
 * Shows the current measure and the next measure. Note values are quantized
 * from beat durations — quarter notes, half notes, eighth notes, dotted
 * variants, and thirty-second notes are all rendered correctly. Rests fill
 * all gaps automatically. Active notes (at currentBeat) are highlighted in
 * accent red.
 *
 * The playhead is a React overlay updated every tick without triggering a
 * VexFlow re-render. VexFlow only re-renders when the current measure
 * changes, the active note set changes, or notes/fingering change.
 *
 * @param {{
 *   notes:               import('../lib/constants').NoteEvent[],
 *   currentBeat:         number,
 *   activeFingeringMap?: Object.<number, string>,
 *   scoreHeight?:        number,
 *   beatsPerMeasure?:    number,
 * }} props
 */
export function MusicScore({
  notes,
  currentBeat,
  activeFingeringMap = {},
  scoreHeight        = SCORE_HEIGHT_PX,
  beatsPerMeasure    = 4,
}) {
  const vfContainerRef = useRef(null)
  const layoutRef      = useRef(null)
  const [playheadLeft, setPlayheadLeft] = useState('20%')
  const [fontsReady, setFontsReady] = useState(
    () => typeof document !== 'undefined' && document.fonts?.check?.('16px Bravura') === true
  )

  useEffect(() => {
    if (fontsReady) return
    if (typeof document === 'undefined' || !document.fonts?.load) return
    let cancelled = false
    document.fonts.load('16px Bravura').then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => { cancelled = true }
  }, [fontsReady])

  const currentMeasure = Math.max(0, Math.floor(currentBeat / beatsPerMeasure))

  const activePitches = new Set(
    notes
      .filter((n) => n.startTime <= currentBeat && n.startTime + n.duration > currentBeat)
      .map((n) => n.pitch)
  )
  const activePitchKey = [...activePitches].sort().join(',')

  // VexFlow render — fires only when measure or active notes change
  useEffect(() => {
    if (!vfContainerRef.current) return
    const layout = renderScore({
      container:       vfContainerRef.current,
      notes,
      currentMeasure,
      beatsPerMeasure,
      fingeringMap:    activeFingeringMap,
      activePitches,
      scoreHeight,
    })
    layoutRef.current = layout
  }, [currentMeasure, activePitchKey, notes, activeFingeringMap, scoreHeight, beatsPerMeasure, fontsReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Playhead position — fires every tick without touching VexFlow DOM
  useEffect(() => {
    const layout = layoutRef.current
    if (!layout) return
    const { noteStartX, noteEndX, containerWidth } = layout
    const beatInMeasure = ((currentBeat % beatsPerMeasure) + beatsPerMeasure) % beatsPerMeasure
    const frac          = Math.min(beatInMeasure / beatsPerMeasure, 1)
    const xPx           = noteStartX + frac * (noteEndX - noteStartX)
    setPlayheadLeft(`${((xPx / containerWidth) * 100).toFixed(2)}%`)
  }, [currentBeat, beatsPerMeasure])

  return (
    <div className="relative w-full" style={scoreWrapperStyle(scoreHeight)}>
      <div ref={vfContainerRef} className="absolute inset-0" />
      <div className="absolute top-0 bottom-0 pointer-events-none" style={playheadStyle(playheadLeft)} />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const scoreWrapperStyle = (height) => ({ height })

const playheadStyle = (left) => ({
  left,
  width:           2,
  backgroundColor: ACCENT_COLOR,
  opacity:         0.65,
  zIndex:          10,
})
