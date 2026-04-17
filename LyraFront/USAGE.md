# Lyra Exercise Interface — Developer Guide

This guide covers everything needed to create exercises, configure the interface, and wire it into a backend scheduler. The single entry point is `<ExerciseInterface config={...} />`.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [ExerciseConfig Reference](#exerciseconfig-reference)
3. [Writing Notes (NoteEvent[])](#writing-notes-noteevent)
4. [Playback Modes](#playback-modes)
5. [Scaffold Levels](#scaffold-levels)
6. [Fingering System](#fingering-system)
7. [Metrics System](#metrics-system)
8. [Real-time Input Hints](#real-time-input-hints)
9. [Panel Visibility](#panel-visibility)
10. [Keyboard Range](#keyboard-range)
11. [Session Flow (useExerciseSession)](#session-flow-useexercisesession)
12. [Parsing MIDI Files](#parsing-midi-files)
13. [Dev Log Panel](#dev-log-panel)
14. [Complete Example](#complete-example)
15. [Architecture Notes](#architecture-notes)

---

## Quick Start

```jsx
import { ExerciseInterface } from './components/exercise/ExerciseInterface.jsx'

const config = {
  id:  'my-exercise',
  bpm: 80,
  notes: [
    { id: 'n1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
    { id: 'n2', pitch: 62, startTime: 1, duration: 1, hand: 'right' },
    { id: 'n3', pitch: 64, startTime: 2, duration: 1, hand: 'right' },
    { id: 'n4', pitch: 65, startTime: 3, duration: 1, hand: 'right' },
  ],
  onComplete(result) {
    console.log(result)
  },
}

export default function App() {
  return <ExerciseInterface config={config} />
}
```

---

## ExerciseConfig Reference

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | Exercise identifier, echoed in `ExerciseResult` |
| `bpm` | `number` | **required** | Beats per minute (also controls note sound duration) |
| `notes` | `NoteEvent[]` | **required** | All note events |
| `mode` | `'free' \| 'step'` | `'free'` | Playback mode — see [Playback Modes](#playback-modes) |
| `scaffold` | `string` | `'full'` | Visual aid level — see [Scaffold Levels](#scaffold-levels) |
| `panels` | `PanelConfig` | all `true` | Which panels to show — see [Panel Visibility](#panel-visibility) |
| `fingeringMap` | `FingeringMap` | `{}` | Pitch → fingering code — see [Fingering System](#fingering-system) |
| `fingeringChanges` | `FingeringChange[]` | `[]` | Scheduled mid-exercise fingering updates |
| `metrics` | `MetricDefinition[]` | `[]` | What to measure — see [Metrics System](#metrics-system) |
| `aiCommentaryLines` | `string[]` | `[]` | Lines shown in the AI commentary header |
| `exerciseInstruction` | `string` | — | Subtitle instruction text |
| `onNoteHint` | `function` | — | Called on each note press — see [Hints](#real-time-input-hints) |
| `keyboard.startOctave` | `number` | `2` | Lowest octave rendered (C2 = MIDI 36) |
| `keyboard.octaves` | `number` | `5` | Number of octaves rendered |
| `beatsPerMeasure` | `number` | `4` | Time signature numerator (affects score rendering) |
| `onComplete` | `function(ExerciseResult)` | — | Called with results when each loop ends |

---

## Writing Notes (NoteEvent[])

Each note event:

```js
{
  id:        string,             // unique within the exercise
  pitch:     number,             // MIDI pitch (middle C = 60)
  startTime: number,             // start in beats (float, 0-based)
  duration:  number,             // duration in beats (float, min 0.1)
  hand:      'left' | 'right',   // which staff / tile colour
  finger:    1|2|3|4|5,          // (optional) overridden by fingeringMap
}
```

**Beat timing** — the beat grid is independent of BPM. At 80 BPM, 1 beat = 0.75 s. In `free` mode the engine counts from `BEAT_START_OFFSET = -2`, giving 2 beats of silent lead-in before beat 0. In `step` mode the beat jumps straight to the first note on Play.

**Score notation** — `duration` is quantized to the nearest standard note value automatically:

| `duration` (beats) | Notation |
|---|---|
| `4.0` | Whole note |
| `3.0` | Dotted half |
| `2.0` | Half note |
| `1.5` | Dotted quarter |
| `1.0` | Quarter note |
| `0.75` | Dotted eighth |
| `0.5` | Eighth note |
| `0.25` | Sixteenth note |
| `0.125` | Thirty-second note |

**Chords** — simultaneous notes on the same hand are automatically grouped into a chord in the score and rendered as stacked tiles. Give them the same `startTime`:

```js
// C major chord on beat 0
{ id: 'c', pitch: 60, startTime: 0, duration: 1, hand: 'right' },
{ id: 'e', pitch: 64, startTime: 0, duration: 1, hand: 'right' },
{ id: 'g', pitch: 67, startTime: 0, duration: 1, hand: 'right' },
```

---

## Playback Modes

### `mode: 'free'` (default)

The beat advances continuously on a timer at the exercise's BPM. A 2-beat silent lead-in (`BEAT_START_OFFSET = -2`) plays before the first note. Standard Synthesia-style behaviour.

### `mode: 'step'`

The beat is frozen and only advances when the user plays the correct note(s). There is no tempo — the student can take as long as needed.

**Behaviour:**
- On Play, the beat jumps immediately to the first note's `startTime` (no lead-in).
- The beat stays frozen until all notes that **start exactly at** `currentBeat` have been pressed.
- For chords, every pitch in the group must be played before the beat advances.
- Wrong notes (pitches not in the current group) are ignored for advancement purposes.
- When the last note group is completed, `onComplete` fires normally.

**Recommended config for step mode:**
```js
{
  mode: 'step',
  panels: { metronome: false },  // metronome is meaningless without tempo
  scaffold: 'full',              // maximum visual guidance
}
```

**Dev log** — step advances are logged as `ST` (purple) events in the dev log, making it easy to verify the beat is advancing correctly.

---

## Scaffold Levels

The `scaffold` field controls how much visual guidance is shown. Reduce it as the student improves.

| Level | Tile colour | Tile label | Keyboard guide | Score fingers |
|---|---|---|---|---|
| `'bare'` | neutral grey | none | off | off |
| `'position'` | neutral grey | none | **on** | off |
| `'label'` | neutral grey | note name (C♯) | on | off |
| `'color'` | hand colour | none | on | off |
| `'full'` *(default)* | hand colour | finger number | on | **on** |

The levels are ordered — `scaffoldAtLeast(current, minimum)` from `constants.js` lets you test whether a level provides at least a given amount of aid. Use this if writing custom components that respond to scaffold.

---

## Fingering System

### FingeringMap

Maps MIDI pitches to fingering instruction codes. Format: `"L1"`–`"L5"` (left hand) or `"R1"`–`"R5"` (right hand). Finger 1 = thumb, 5 = pinky.

```js
fingeringMap: {
  60: 'R1',   // C4  → right thumb
  62: 'R2',   // D4  → right index
  64: 'R3',   // E4  → right middle
  65: 'R1',   // F4  → right thumb (thumb crosses under)
  48: 'L5',   // C3  → left pinky
}
```

When a `fingeringMap` is present:
- **Hand diagrams** highlight the correct finger for the active note
- **Score** shows finger numbers above/below note heads (single notes only)
- **Tile colours** and **keyboard highlights** use the map's L/R hand rather than `note.hand`

### FingeringChanges

Schedule fingering updates mid-exercise. Each change is merged into the active map at the given beat. Only the specified pitches are affected; others persist.

```js
fingeringChanges: [
  { beat: 4, map: { 60: 'R2', 62: 'R3', 64: 'R4' } },
]
```

---

## Metrics System

There is no shared metrics library. Each exercise owns its full `compute` logic. After each loop the evaluator calls every `compute` function with `(expectedNotes, playedNotes)` and passes the results to `onComplete`.

### Defining metrics

```js
import { TIMING_TOLERANCE_BEATS } from './lib/constants.js'

metrics: [
  {
    label:      'pitch_accuracy',  // sent to the backend as-is
    difficulty: 0.5,               // 0.0–1.0 — how hard this metric is in this exercise
    compute(expected, played) {
      if (expected.length === 0) return 0
      const playedPitches = new Set(played.map((p) => p.pitch))
      return expected.filter((n) => playedPitches.has(n.pitch)).length / expected.length
    },
  },
  {
    label:      'timing',
    difficulty: 0.7,
    compute(expected, played) {
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
        const bestError = candidates.reduce(
          (min, b) => Math.min(min, Math.abs(b - note.startTime)), Infinity
        )
        scores.push(Math.max(0, 1 - bestError / TIMING_TOLERANCE_BEATS))
      }
      return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0
    },
  },
]
```

### Sharing compute logic across exercises

Define helper functions at the top of the exercise file (private, not exported). Import only constants from the framework:

```js
import { TIMING_TOLERANCE_BEATS } from './lib/constants.js'

function computePitchAccuracy(expected, played) { ... }
function computeTiming(expected, played)        { ... }
function computeRhythm(expected, played)        { ... }

const EXERCISE_A = {
  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.4, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],
}
```

### `compute` function contract

```
compute(
  expected: NoteEvent[],                      // exercise's own notes
  played:   Array<{ pitch: number, beat: number }>  // recorded MIDI input
) => number   // 0.0–1.0
```

`played` contains every note-on received during the loop. Multiple attempts at the same pitch are all present; your compute function chooses how to handle them (e.g. best attempt, first attempt).

### ExerciseResult shape

```js
{
  exerciseId:  'my-exercise',
  completedAt: 1718000000000,   // Date.now()
  metrics: [
    { label: 'pitch_accuracy', value: 0.83, difficulty: 0.5 },
    { label: 'timing',         value: 0.61, difficulty: 0.7, delta: 0.12 },
    //                                                        ↑ optional: filled by backend
  ]
}
```

`delta` (−1 to +1) is an optional improvement indicator filled by the backend when comparing to the student's history. It is displayed in the result overlay as a coloured badge if present.

---

## Real-time Input Hints

`onNoteHint` fires on every MIDI note-on during playback. Return a string to show a hint bubble above the keyboard, or `null` for no hint. The hint auto-clears after 2 seconds.

```js
import { pitchToNoteName } from './lib/pianoLayout.js'

onNoteHint(pitch, beat, activeNotes) {
  // No note expected right now
  if (activeNotes.length === 0) return 'Wait for the cue...'

  // Wrong pitch played
  const expected = activeNotes.map((n) => n.pitch)
  if (!expected.includes(pitch)) {
    const names = expected.map(pitchToNoteName).join(', ')
    return `Expected ${names}`
  }

  return null  // correct note — no hint
},
```

**Signature:** `(pitch: number, beat: number, activeNotes: NoteEvent[]) => string | null`

`activeNotes` contains notes whose `startTime <= currentBeat < startTime + duration`. In step mode, `activeNotes` includes long-duration notes (e.g. bass notes) that started earlier — use `activeNotes.filter(n => Math.abs(n.startTime - beat) < 0.1)` if you want only notes starting at this exact beat.

---

## Panel Visibility

Set any panel to `false` to hide it. All default to `true` except `devLog`.

```js
panels: {
  aiCommentary: false,   // hide the AI agent + commentary + instruction
  musicScore:   true,    // grand staff notation
  fallingNotes: false,   // hide Synthesia-style tiles entirely
  leftHand:     false,   // hide left hand diagram
  rightHand:    true,
  metronome:    false,   // recommended for step mode
  playControls: true,
  midiStatus:   true,
  devLog:       true,    // floating event log (dev builds only)
}
```

Setting `fallingNotes: false` leaves the music score and keyboard guide as the only real-time visual aids. Combine with `scaffold: 'bare'` for a pure score-reading experience.

---

## Keyboard Range

```js
keyboard: {
  startOctave: 2,   // C2 = MIDI 36 (default: 2)
  octaves:     5,   // C2–B6  (default: 5)
}
```

The keyboard and falling notes always use identical layout math (`pianoLayout.js`), so tiles land precisely on keys regardless of the range.

---

## Session Flow (useExerciseSession)

Manages a sequential queue of exercises with automatic state reset between them.

```js
import { ExerciseInterface }     from './components/exercise/ExerciseInterface.jsx'
import { ExerciseResultOverlay } from './components/exercise/ExerciseResultOverlay.jsx'
import { useExerciseSession }    from './hooks/useExerciseSession.js'

function App() {
  const {
    currentConfig,
    index,
    total,
    lastResult,
    isTransitioning,
    advance,
    jumpTo,
  } = useExerciseSession([exerciseA, exerciseB, exerciseC])

  return (
    <div className="relative w-full h-screen">
      <ExerciseInterface
        config={currentConfig}
        devExercises={[exerciseA, exerciseB, exerciseC]}
        devExerciseIndex={index}
        onDevSelectExercise={jumpTo}
      />

      {isTransitioning && (
        <ExerciseResultOverlay result={lastResult} onNext={advance} />
      )}
    </div>
  )
}
```

| Return value | Type | Description |
|---|---|---|
| `currentConfig` | `ExerciseConfig` | Active exercise (with `onComplete` wrapped) |
| `index` | `number` | Current position in the queue |
| `total` | `number` | Total number of exercises |
| `lastResult` | `ExerciseResult \| null` | Result from the completed loop |
| `isTransitioning` | `boolean` | `true` while the result overlay is shown |
| `advance()` | `function` | Move to next exercise (wraps to 0) |
| `jumpTo(i)` | `function` | Jump directly to index `i` |

When a loop ends, `onComplete` is called, `isTransitioning` becomes `true`, and the overlay appears. Calling `advance()` (or the auto-advance timer) loads the next exercise and resets all state.

`ExerciseResultOverlay` auto-advances after 5 seconds. Pass `autoMs` to change the delay:

```jsx
<ExerciseResultOverlay result={lastResult} onNext={advance} autoMs={3000} />
```

---

## Parsing MIDI Files

```js
import { parseMidi } from './lib/midiParser.js'

const response = await fetch('/exercises/scale.mid')
const buffer   = await response.arrayBuffer()

const { notes, detectedBpm } = parseMidi(buffer, {
  handSplitPitch: 60,   // pitches < 60 → left hand (default)
})

const config = {
  id:  'parsed-scale',
  bpm: detectedBpm,
  notes,
}
```

`parseMidi` uses `@tonejs/midi` internally. All times are converted from seconds to beats using `timeInSeconds × (bpm / 60)`. The `finger` field is left `undefined`; add a `fingeringMap` separately if needed.

---

## Dev Log Panel

Enable with `panels: { devLog: true }`. Renders only in development builds (`import.meta.env.DEV`). Shows a floating dark panel (bottom-left) with real-time event entries.

| Badge | Colour | Fires when |
|---|---|---|
| `EX` | green | Exercise loaded — logs id, bpm, note count, mode, scaffold |
| `BT` | grey | Every integer beat crossing (accent beats flagged with ♩) |
| `ON` | amber | MIDI note-on received — pitch, velocity, beat |
| `HT` | red | Hint fired — hint text and beat position |
| `RE` | teal | Loop result — label, score %, difficulty per metric |
| `ST` | purple | Step mode beat advance — target beat or "end" |

The panel includes:
- **Exercise selector pills** — click to jump to any exercise in the queue
- **Minimize button** — collapses to a header bar, expands on click
- **Clear button** — empties the log

The panel is completely removed from production builds by Vite's dead-code elimination (`import.meta.env.DEV` is replaced with `false` at build time).

---

## Complete Example

```js
import { TIMING_TOLERANCE_BEATS } from './lib/constants.js'
import { pitchToNoteName }        from './lib/pianoLayout.js'

// ─── Local metric helpers ────────────────────────────────────────────────────

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
    const bestError = candidates.reduce(
      (min, b) => Math.min(min, Math.abs(b - note.startTime)), Infinity
    )
    scores.push(Math.max(0, 1 - bestError / TIMING_TOLERANCE_BEATS))
  }
  return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0
}

// ─── Exercise definition ─────────────────────────────────────────────────────

export const C_MAJOR_SCALE = {
  id:       'c-major-scale-rh',
  bpm:      72,
  scaffold: 'full',

  notes: [
    { id: 'n1', pitch: 60, startTime: 0, duration: 1, hand: 'right' },  // C4
    { id: 'n2', pitch: 62, startTime: 1, duration: 1, hand: 'right' },  // D4
    { id: 'n3', pitch: 64, startTime: 2, duration: 1, hand: 'right' },  // E4
    { id: 'n4', pitch: 65, startTime: 3, duration: 1, hand: 'right' },  // F4
    { id: 'n5', pitch: 67, startTime: 4, duration: 1, hand: 'right' },  // G4
    { id: 'n6', pitch: 69, startTime: 5, duration: 1, hand: 'right' },  // A4
    { id: 'n7', pitch: 71, startTime: 6, duration: 1, hand: 'right' },  // B4
    { id: 'n8', pitch: 72, startTime: 7, duration: 1, hand: 'right' },  // C5
    { id: 'l1', pitch: 48, startTime: 0, duration: 4, hand: 'left'  },  // C3
    { id: 'l2', pitch: 43, startTime: 4, duration: 4, hand: 'left'  },  // G2
  ],

  fingeringMap: {
    60: 'R1', 62: 'R2', 64: 'R3', 65: 'R1',   // thumb crosses under at F4
    67: 'R2', 69: 'R3', 71: 'R4', 72: 'R5',
    48: 'L5', 43: 'L5',
  },

  aiCommentaryLines: [
    'Keep your wrist level and your elbow relaxed.',
    'The thumb passes under on the F — practise that crossing slowly.',
  ],
  exerciseInstruction: 'C major scale, one octave, right hand.',

  panels: { devLog: true },  // remove or omit in production

  metrics: [
    { label: 'pitch_accuracy', difficulty: 0.3, compute: computePitchAccuracy },
    { label: 'timing',         difficulty: 0.5, compute: computeTiming },
  ],

  onNoteHint(pitch, beat, activeNotes) {
    const expected = activeNotes.map((n) => n.pitch)
    if (expected.length === 0) return null
    if (!expected.includes(pitch)) {
      return `Expected ${expected.map(pitchToNoteName).join(', ')}`
    }
    return null
  },

  onComplete(result) {
    // POST result to the CNN scheduler in production
    console.log('Result:', result)
  },
}
```

### Step mode variant

```js
export const C_MAJOR_STEP = {
  ...C_MAJOR_SCALE,
  id:    'c-major-step',
  mode:  'step',
  panels: { metronome: false, devLog: true },
  aiCommentaryLines: ['Press each key to advance — no tempo.'],
}
```

---

## Architecture Notes

- **`containerWidth`** is measured once by `ExerciseInterface` (via `useContainerSize`) and passed as a prop to both `FallingNotes` and `PianoKeyboard`. Never measure it separately — this is what keeps tiles aligned with keys on resize.
- **`currentBeat`** advances by `TICK_FRACTION = 0.05` every `(60/bpm) × 1000 × 0.05` ms in free mode. In step mode it only changes when `stepBeat(targetBeat)` is called. Avoid reading `Date.now()` for timing — always use `currentBeat`.
- **`onComplete`** fires when `currentBeat > loopEndBeat` (free mode) or when the last note group is completed (step mode). The evaluator is reset immediately after, so `computeResult` must be called before any async work.
- **Config changes** trigger an automatic full reset: playback stops, beat returns to `BEAT_START_OFFSET`, evaluator clears, fingering map resets. The parent just passes a new `config` prop — no imperative API needed.
- **Styling** — all inline style objects live in a `// ─── Styles ───` section at the bottom of each component file. Static styles are collected into a `const S = {}` object; dynamic styles (depending on props/state) are standalone functions returning style objects.
- **Production safety** — `DevLog` and all `import.meta.env.DEV` branches are stripped by Vite at build time. No dev code ships to production.
