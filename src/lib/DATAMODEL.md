# Lyra — Data Model Reference

This document describes every data type that crosses a boundary in the exercise
interface: between the backend and the UI, between the UI and the MIDI parser,
and between the exercise definition and the evaluator.

---

## Core types

### `NoteEvent`

The atomic unit of musical content. Both hand-authored exercises and parsed
MIDI files produce arrays of these.

| Field       | Type                      | Required | Description                                              |
|-------------|---------------------------|----------|----------------------------------------------------------|
| `id`        | `string`                  | Yes      | Unique within the exercise                               |
| `pitch`     | `number`                  | Yes      | MIDI pitch 0–127 (middle C = 60)                        |
| `startTime` | `number`                  | Yes      | Start position in **beats** (float)                      |
| `duration`  | `number`                  | Yes      | Duration in **beats** (float, minimum 0.1)               |
| `hand`      | `"left" \| "right"`       | Yes      | Which hand plays this note                               |
| `finger`    | `1 \| 2 \| 3 \| 4 \| 5`  | No       | Finger number (1 = thumb). Overridden by `fingeringMap`. |

> **Timing units**: everything is in beats, not seconds or milliseconds.
> Conversion: `beats = seconds × (bpm / 60)`.

---

### `FingeringMap`

A plain object mapping MIDI pitch to a fingering instruction code.

```
{ [midiPitch: number]: string }
```

**Code format**: `"L1"` through `"L5"` (left hand) or `"R1"` through `"R5"` (right hand).
Finger 1 = thumb, 5 = pinky — standard piano fingering convention.

```js
{ 60: "R1", 62: "R2", 64: "R3", 48: "L5" }
// C4 → right thumb, D4 → right index, E4 → right middle, C3 → left pinky
```

When a `FingeringMap` is present on `ExerciseConfig`:
- The **hand diagram** reads finger/hand from the map rather than `NoteEvent.finger`.
- The **score** shows finger numbers above/below note heads (single notes only).
- **Note tile colours** and **keyboard highlights** use the L/R prefix for hand
  assignment instead of `NoteEvent.hand`.

---

### `FingeringChange`

A scheduled mid-exercise update to the active `FingeringMap`.
Applied at `beat`, merging the given map into the current one.
Only the specified pitches are affected; others persist unchanged.

| Field  | Type           | Description                           |
|--------|----------------|---------------------------------------|
| `beat` | `number`       | Beat at which to apply the update     |
| `map`  | `FingeringMap` | Entries to merge into the current map |

```js
fingeringChanges: [
  { beat: 4, map: { 60: "R2", 62: "R3", 64: "R4" } },
]
```

---

### `MetricDefinition`

Defined by the exercise author. Specifies what is being measured, how hard it
is, and how to compute the score from the raw input data.

| Field        | Type       | Description                                                |
|--------------|------------|------------------------------------------------------------|
| `label`      | `string`   | Identifier sent to the backend (e.g. `"rhythm"`)           |
| `difficulty` | `number`   | 0.0–1.0 — how hard this metric is in this specific exercise|
| `compute`    | `function` | `(expectedNotes, playedNotes) => number (0.0–1.0)`         |

The `compute` function receives:
- `expectedNotes`: `NoteEvent[]` from the exercise config
- `playedNotes`:   `Array<{ pitch: number, beat: number }>` recorded during the loop

There is no shared metrics library. Each exercise defines its own `compute`
logic. Common implementations can be shared as local helper functions within
the same file (not exported). The only external dependency needed for most
metrics is `TIMING_TOLERANCE_BEATS` from `constants.js`.

```js
import { TIMING_TOLERANCE_BEATS } from './constants.js'

// Local helper — not exported
function computePitchAccuracy(expected, played) {
  if (expected.length === 0) return 0
  const playedPitches = new Set(played.map((p) => p.pitch))
  return expected.filter((n) => playedPitches.has(n.pitch)).length / expected.length
}

metrics: [
  { label: 'pitch_accuracy', difficulty: 0.5, compute: computePitchAccuracy },
]
```

---

### `MetricResult`

What the backend receives for each metric after a loop completes.

| Field        | Type     | Description                                       |
|--------------|----------|---------------------------------------------------|
| `label`      | `string` | Matches the `MetricDefinition` label              |
| `value`      | `number` | Score 0.0–1.0 returned by `compute()`             |
| `difficulty` | `number` | Echoed from `MetricDefinition.difficulty`         |
| `delta`      | `number` | Optional −1 to +1 improvement, filled by backend |

---

### `ExerciseResult`

Sent to `config.onComplete` at the end of each loop.
The backend / CNN uses this to schedule the next exercise.

| Field         | Type             | Description                      |
|---------------|------------------|----------------------------------|
| `exerciseId`  | `string?`        | Echoed from `ExerciseConfig.id`  |
| `metrics`     | `MetricResult[]` | One entry per `MetricDefinition` |
| `completedAt` | `number`         | `Date.now()` timestamp           |

---

## `ExerciseConfig`

The single object passed to `<ExerciseInterface config={...} />`.

| Field                  | Type                                          | Default      | Description                                               |
|------------------------|-----------------------------------------------|--------------|-----------------------------------------------------------|
| `id`                   | `string`                                      | —            | Exercise identifier, echoed in results                    |
| `bpm`                  | `number`                                      | **required** | Beats per minute                                          |
| `notes`                | `NoteEvent[]`                                 | **required** | All note events for this exercise                         |
| `mode`                 | `'free' \| 'step'`                            | `'free'`     | `'free'` = timer-driven; `'step'` = input-driven          |
| `scaffold`             | `'bare'\|'position'\|'label'\|'color'\|'full'`| `'full'`     | Visual aid level                                          |
| `panels`               | `PanelConfig`                                 | all `true`   | Which UI panels are visible                               |
| `fingeringMap`         | `FingeringMap`                                | `{}`         | Initial pitch → fingering assignments                     |
| `fingeringChanges`     | `FingeringChange[]`                           | `[]`         | Timed map updates applied mid-exercise                    |
| `metrics`              | `MetricDefinition[]`                          | `[]`         | What this exercise measures and how                       |
| `aiCommentaryLines`    | `string[]`                                    | `[]`         | Lines shown in the AI commentary header                   |
| `exerciseInstruction`  | `string`                                      | —            | Instruction subtitle below the AI mark                    |
| `onNoteHint`           | `function`                                    | —            | `(pitch, beat, activeNotes) => string \| null`            |
| `keyboard.startOctave` | `number`                                      | `2`          | Lowest octave on the keyboard (C2 = MIDI 36)              |
| `keyboard.octaves`     | `number`                                      | `5`          | Number of octaves displayed                               |
| `beatsPerMeasure`      | `number`                                      | `4`          | Time signature numerator — affects score rendering        |
| `onComplete`           | `function(ExerciseResult)`                    | —            | Called with `ExerciseResult` when each loop finishes      |

---

## `PanelConfig`

All fields default to `true`. Set a field to `false` to hide that panel.

| Field          | Default | Controls                                       |
|----------------|---------|------------------------------------------------|
| `aiCommentary` | `true`  | AI agent mark + commentary text + instruction  |
| `musicScore`   | `true`  | Grand staff notation (VexFlow)                 |
| `fallingNotes` | `true`  | Synthesia-style falling note tiles             |
| `leftHand`     | `true`  | Left hand diagram with active-finger highlight |
| `rightHand`    | `true`  | Right hand diagram with active-finger highlight|
| `metronome`    | `true`  | Pendulum metronome (not useful in step mode)   |
| `playControls` | `true`  | Play / Pause button                            |
| `midiStatus`   | `true`  | MIDI device connection indicator               |
| `devLog`       | `false` | Floating event log (dev builds only, opt-in)   |

---

## Playback modes

### `'free'` (default)

Beat advances on a `setInterval` timer at the exercise's BPM. A 2-beat silent
lead-in (`BEAT_START_OFFSET = -2`) plays before beat 0. The loop resets and
fires `onComplete` when `currentBeat > loopEndBeat`.

### `'step'`

No timer runs. On Play, `currentBeat` immediately jumps to the `startTime` of
the first note (skipping the lead-in). The beat stays frozen until the user
plays all pitches that share that `startTime`. Wrong notes do not advance the
beat; partial chord completion does not advance the beat — all pitches at the
current position must be hit.

When the last note group is complete, `onComplete` fires and the exercise ends.

---

## MIDI file integration

Use `parseMidi(buffer, options)` from `midiParser.js` to convert a `.mid`
`ArrayBuffer` into `NoteEvent[]`.

```js
import { parseMidi } from './midiParser.js'

const response = await fetch('/exercises/scale.mid')
const buffer   = await response.arrayBuffer()
const { notes, detectedBpm } = parseMidi(buffer, {
  handSplitPitch: 60,   // notes below middle C → left hand (default)
})
```

The returned `notes` array is ready to pass directly to `ExerciseConfig.notes`.
`detectedBpm` can be used for `ExerciseConfig.bpm`. The `finger` field is left
`undefined` on all parsed notes; add a `fingeringMap` separately if needed.

---

## Dev log event types

The dev log panel (enabled via `panels: { devLog: true }`) emits the following event types. It is only present in development builds.

| Badge | Type       | Colour | Fires when                                                      |
|-------|------------|--------|-----------------------------------------------------------------|
| `EX`  | `exercise` | green  | Exercise loaded — logs id, bpm, note count, mode, scaffold      |
| `BT`  | `beat`     | grey   | Every integer beat crossing (accent beats flagged ♩)            |
| `ON`  | `note_on`  | amber  | MIDI note-on — pitch, velocity, beat                            |
| `HT`  | `hint`     | red    | Hint fired — text and beat position                             |
| `RE`  | `result`   | teal   | Loop result — label, score %, difficulty per metric             |
| `ST`  | `step`     | purple | Step mode beat advance — logs target beat or "end"              |
