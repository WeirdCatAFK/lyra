import { useEffect, useMemo, useRef, useState } from 'react'
import { AICommentary }  from './AICommentary.jsx'
import { MusicScore }    from './MusicScore.jsx'
import { FallingNotes }  from './FallingNotes.jsx'
import { HandDiagram }   from './HandDiagram.jsx'
import { Metronome }     from './Metronome.jsx'
import { NoteHint }      from './NoteHint.jsx'
import { DevLog }        from '../dev/DevLog.jsx'
import { PlayControls }  from './PlayControls.jsx'
import { MidiStatus }    from './MidiStatus.jsx'
import { PianoKeyboard } from './PianoKeyboard.jsx'

import { useContainerSize }    from '../../hooks/useContainerSize.js'
import { usePlaybackEngine }   from '../../hooks/usePlaybackEngine.js'
import { useWebMidi }          from '../../hooks/useWebMidi.js'
import { useExerciseEvaluator} from '../../hooks/useExerciseEvaluator.js'
import { useAudioEngine }      from '../../hooks/useAudioEngine.js'
import { useEventLog }         from '../../hooks/useEventLog.js'
import { parseFingeringCode }  from '../../lib/midiParser.js'
import {
  KEYBOARD_START_OCTAVE,
  KEYBOARD_OCTAVES,
  KEYBOARD_HEIGHT_PX,
  SCORE_HEIGHT_PX,
  scaffoldAtLeast,
} from '../../lib/constants.js'

/**
 * Root exercise interface.
 * Receives an ExerciseConfig and orchestrates all panels.
 *
 * @param {{ config: import('../lib/constants').ExerciseConfig }} props
 */
export function ExerciseInterface({ config, devExercises = [], devExerciseIndex = 0, onDevSelectExercise }) {
  // ─── Panel visibility (all default to true) ────────────────────────────
  const panels = {
    aiCommentary: true,
    musicScore:   true,
    fallingNotes: true,
    leftHand:     true,
    rightHand:    true,
    metronome:    true,
    playControls: true,
    midiStatus:   true,
    devLog:       false,
    ...config.panels,
  }

  // ─── Exercise mode ───────────────────────────────────────────────────────
  const mode = config.mode ?? 'free'

  // ─── Scaffold level ─────────────────────────────────────────────────────
  const scaffold = config.scaffold ?? 'full'

  // ─── Event log ──────────────────────────────────────────────────────────
  const { entries: logEntries, emit, clear: clearLog } = useEventLog()

  // ─── Keyboard range ─────────────────────────────────────────────────────
  const startOctave = config.keyboard?.startOctave ?? KEYBOARD_START_OCTAVE
  const octaves     = config.keyboard?.octaves     ?? KEYBOARD_OCTAVES

  // ─── Loop end beat ──────────────────────────────────────────────────────
  const loopEndBeat = useMemo(() => {
    if (!config.notes.length) return 8
    return Math.max(...config.notes.map((n) => n.startTime + n.duration)) + 2
  }, [config.notes])

  // ─── Evaluator ──────────────────────────────────────────────────────────
  const evaluator = useExerciseEvaluator(config.notes)

  function handleLoopEnd() {
    const result = evaluator.computeResult(config)
    config.onComplete?.(result)
    evaluator.reset()
    result.metrics.forEach((m) =>
      emit('result', `${m.label}: ${(m.value * 100).toFixed(0)}%  diff=${m.difficulty}`)
    )
  }

  // ─── Audio engine ───────────────────────────────────────────────────────
  const { playNote, playClick } = useAudioEngine()

  // ─── Playback engine ────────────────────────────────────────────────────
  const { currentBeat, isPlaying, toggle, reset, stop, stepBeat } = usePlaybackEngine(
    config.bpm,
    loopEndBeat,
    { onLoopEnd: handleLoopEnd, mode }
  )

  // ─── Step mode — jump to first note when play starts ───────────────────
  // In step mode the beat stays frozen until the user plays; skip the lead-in
  // and park immediately at the first note's startTime.
  useEffect(() => {
    if (mode !== 'step' || !isPlaying) return
    const firstBeat = config.notes.reduce((min, n) => Math.min(min, n.startTime), Infinity)
    stepBeat(isFinite(firstBeat) ? firstBeat : 0)
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step mode — per-note hit tracking ─────────────────────────────────
  // Tracks which pitches that START at currentBeat have been played.
  // Cleared every time currentBeat changes (= a new note group was reached).
  const stepHitRef = useRef(new Set())
  useEffect(() => {
    if (mode === 'step') stepHitRef.current = new Set()
  }, [currentBeat]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Note hint (auto-clears after 2 s) ──────────────────────────────────
  const [hintText, setHintText]   = useState(null)
  const hintTimeoutRef            = useRef(null)

  function showHint(text) {
    setHintText(text)
    clearTimeout(hintTimeoutRef.current)
    hintTimeoutRef.current = setTimeout(() => setHintText(null), 2000)
  }

  // ─── Web MIDI ───────────────────────────────────────────────────────────
  const { pressedNotes, devices, isConnected, error: midiError } = useWebMidi({
    onNoteOn: (pitch, velocity) => {
      playNote(pitch, velocity)
      emit('note_on', `pitch ${pitch}  vel ${(velocity * 127).toFixed(0)}`, currentBeat)
      if (isPlaying) {
        evaluator.recordNote(pitch, currentBeat)
        const hint = config.onNoteHint?.(pitch, currentBeat, activeNotes)
        if (hint) { showHint(hint); emit('hint', hint, currentBeat) }

        // Step mode: advance beat when all notes that start at currentBeat are hit
        if (mode === 'step') {
          const stepExpected = config.notes
            .filter((n) => Math.abs(n.startTime - currentBeat) < 0.01)
            .map((n) => n.pitch)

          if (stepExpected.includes(pitch)) {
            stepHitRef.current.add(pitch)
            const allHit = stepExpected.length > 0 &&
              stepExpected.every((p) => stepHitRef.current.has(p))

            if (allHit) {
              const nextBeat = config.notes
                .map((n) => n.startTime)
                .filter((t) => t > currentBeat + 0.01)
                .reduce((min, t) => Math.min(min, t), Infinity)
              stepBeat(isFinite(nextBeat) ? nextBeat : loopEndBeat + 1)
              emit('step', `advanced → beat ${isFinite(nextBeat) ? nextBeat : 'end'}`, currentBeat)
            }
          }
        }
      }
    },
  })

  // ─── Metronome clicks (fire on each integer beat crossing) ─────────────
  const lastClickBeatRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) { lastClickBeatRef.current = null; return }
    const beatInt = Math.floor(currentBeat)
    if (currentBeat >= 0 && beatInt !== lastClickBeatRef.current) {
      lastClickBeatRef.current = beatInt
      const accent = beatInt % 4 === 0
      playClick(accent)
      emit('beat', accent ? `beat ${beatInt}  ♩ accent` : `beat ${beatInt}`, beatInt)
    }
  }, [currentBeat, isPlaying, playClick, emit])

  // ─── Fingering map (live, updated by fingeringChanges) ──────────────────
  const [activeFingeringMap, setActiveFingeringMap] = useState(
    () => ({ ...config.fingeringMap })
  )
  const appliedChangesRef = useRef(new Set())

  // Reset all state whenever the config changes (new exercise loaded)
  useEffect(() => {
    stop()
    evaluator.reset()
    setActiveFingeringMap({ ...config.fingeringMap })
    setHintText(null)
    appliedChangesRef.current = new Set()
    emit('exercise', `loaded "${config.id ?? 'unnamed'}"  bpm=${config.bpm}  mode=${config.mode ?? 'free'}  scaffold=${config.scaffold ?? 'full'}`)
  }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply scheduled fingering changes as beats pass
  useEffect(() => {
    if (!config.fingeringChanges?.length) return
    config.fingeringChanges.forEach((change, idx) => {
      if (currentBeat >= change.beat && !appliedChangesRef.current.has(idx)) {
        appliedChangesRef.current.add(idx)
        setActiveFingeringMap((prev) => ({ ...prev, ...change.map }))
      }
    })
  }, [currentBeat, config.fingeringChanges])

  const hasCustomFingering = Object.keys(activeFingeringMap).length > 0

  // ─── Derived: active note at current beat ───────────────────────────────
  const activeNotes = useMemo(() => {
    return config.notes.filter(
      (n) => n.startTime <= currentBeat && n.startTime + n.duration > currentBeat
    )
  }, [config.notes, currentBeat])

  function getActiveFinger(hand) {
    const note = activeNotes.find((n) => {
      if (hasCustomFingering && activeFingeringMap[n.pitch]) {
        const parsed = parseFingeringCode(activeFingeringMap[n.pitch])
        return parsed?.hand === hand
      }
      return n.hand === hand
    })
    if (!note) return undefined
    if (hasCustomFingering && activeFingeringMap[note.pitch]) {
      return parseFingeringCode(activeFingeringMap[note.pitch])?.finger
    }
    return note.finger
  }

  const expectedNotes = useMemo(() => {
    if (!scaffoldAtLeast(scaffold, 'position')) return []
    return activeNotes.map((n) => n.pitch)
  }, [activeNotes, scaffold])

  // ─── Layout dimensions ──────────────────────────────────────────────────
  const { ref: containerRef, width: containerWidth } = useContainerSize()
  const DISPLAY_SCORE_HEIGHT = 280
  const scoreBottom = DISPLAY_SCORE_HEIGHT + 60

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden flex flex-col"
      style={S.root}
    >
      {panels.aiCommentary && (
        <AICommentary
          lines={config.aiCommentaryLines ?? []}
          instruction={config.exerciseInstruction}
        />
      )}

      {import.meta.env.DEV && (panels.devLog || devExercises.length > 0) && (
        <DevLog
          entries={logEntries}
          onClear={clearLog}
          exercises={devExercises}
          currentIndex={devExerciseIndex}
          onSelectExercise={onDevSelectExercise}
        />
      )}

      <div className="flex-1 relative">
        {panels.leftHand && (
          <div className="absolute left-8 top-4 z-20">
            <HandDiagram side="left" activeFinger={getActiveFinger('left')} />
          </div>
        )}
        {panels.rightHand && (
          <div className="absolute right-8 top-4 z-20">
            <HandDiagram side="right" activeFinger={getActiveFinger('right')} />
          </div>
        )}

        {panels.musicScore && (
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
            <div className="w-full max-w-2xl px-12">
              <MusicScore
                notes={config.notes}
                currentBeat={currentBeat}
                activeFingeringMap={activeFingeringMap}
                scoreHeight={DISPLAY_SCORE_HEIGHT}
                beatsPerMeasure={config.beatsPerMeasure ?? 4}
              />
            </div>
          </div>
        )}

        {panels.fallingNotes && (
          <FallingNotes
            notes={config.notes}
            currentBeat={currentBeat}
            containerWidth={containerWidth}
            scoreBottom={scoreBottom}
            activeFingeringMap={activeFingeringMap}
            hasCustomFingering={hasCustomFingering}
            scaffold={scaffold}
            startOctave={startOctave}
            octaves={octaves}
          />
        )}
      </div>

      <div className="relative">
        <NoteHint text={hintText} />
        {panels.metronome && (
          <div className="absolute bottom-36 left-6 z-20">
            <Metronome bpm={config.bpm} isPlaying={isPlaying} currentBeat={currentBeat} />
          </div>
        )}

        <div className="absolute bottom-36 right-6 z-20 flex flex-col items-end gap-2">
          {panels.midiStatus && (
            <MidiStatus devices={devices} isConnected={isConnected} error={midiError} />
          )}
          {panels.playControls && (
            <PlayControls isPlaying={isPlaying} onToggle={toggle} />
          )}
        </div>

        <PianoKeyboard
          expectedNotes={expectedNotes}
          pressedNotes={pressedNotes}
          containerWidth={containerWidth}
          startOctave={startOctave}
          octaves={octaves}
        />
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: { backgroundColor: 'var(--color-bg)' },
}
