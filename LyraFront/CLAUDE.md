# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
# Install dependencies
npm install

# Dev server (standard)
npm run dev

# Dev server in demo mode (Vite --mode demo)
npm run dev:demo

# Production build
npm run build

# Preview production build
npm run preview
```

No test runner is configured. Linting uses ESLint 9 flat config (`eslint.config.js`).

The Vite config allows the host `piano.weirdcat.uk` for network access. The `@` alias resolves to `/src`.

---

## Architecture

React 19 + Vite 8 SPA. No router — single view. Tailwind CSS 4 via `@tailwindcss/vite`. No UI component library (no shadcn/Radix).

### Entry point

`src/main.jsx` → `src/App.jsx` → `<ExerciseInterface>` (the root exercise component).

`App.jsx` owns the exercise list (`EXERCISES` array of `ExerciseConfig` objects) and hands them to `useExerciseSession`, which manages sequential playback and the between-exercise result overlay.

### Core component: `ExerciseInterface`

`src/components/exercise/ExerciseInterface.jsx` — the single orchestrating component. It:
- Resolves panel visibility and scaffold level from `config`
- Wires together all hooks (playback, MIDI, evaluator, audio, event log)
- Renders all sub-panels conditionally based on `panels.*` flags

Sub-panels (all in `src/components/exercise/`):
- `AICommentary` — commentary text + exercise instruction header
- `MusicScore` — grand-staff notation via VexFlow 5
- `FallingNotes` — Synthesia-style falling tile lane
- `PianoKeyboard` — interactive keyboard with highlight support
- `HandDiagram` — left/right hand finger-position diagram
- `Metronome` — pendulum visual + BPM display
- `NoteHint` — real-time wrong-note feedback
- `PlayControls` — play/pause button
- `MidiStatus` — WebMIDI device indicator
- `DevLog` (dev only) — floating real-time event log, opt-in via `panels: { devLog: true }`

### Hooks

| Hook | Responsibility |
|------|----------------|
| `usePlaybackEngine` | Beat clock. `'free'` mode: `setInterval` at BPM. `'step'` mode: frozen until `stepBeat()` called. |
| `useExerciseEvaluator` | Records played notes, calls `config.metrics[n].compute()`, fires `onComplete` |
| `useWebMidi` | WebMIDI API — connects MIDI devices, emits note-on/note-off events |
| `useAudioEngine` | Tone.js audio synthesis for note playback |
| `useExerciseSession` | Sequential exercise queue; wraps `onComplete` to capture results and trigger result overlay |
| `useContainerSize` | ResizeObserver for responsive layout calculations |
| `useEventLog` | In-memory event log consumed by `DevLog` |

### Data model

Defined in `src/lib/constants.js` (JSDoc typedefs) and documented in `src/lib/DATAMODEL.md`.

**Key types:**
- `NoteEvent` — `{ id, pitch, startTime, duration, hand, finger? }` — all times in **beats** (not seconds)
- `ExerciseConfig` — the single object passed to `<ExerciseInterface config={...} />`
- `MetricDefinition` — `{ label, difficulty, compute(expectedNotes, playedNotes) => 0–1 }`
- `FingeringMap` — `{ [midiPitch]: "R1"–"R5" | "L1"–"L5" }` — finger 1 = thumb
- `FingeringChange` — `{ beat, map }` — mid-exercise fingering patch applied at a given beat

**Scaffold levels** (ordered least → most visual aid):
`'bare'` → `'position'` → `'label'` → `'color'` → `'full'`

Use `scaffoldAtLeast(current, minimum)` from `constants.js` for comparisons — never compare scaffold strings directly.

**Playback modes:**
- `'free'` (default) — timer-driven, 2-beat lead-in before beat 0
- `'step'` — beat frozen; advances only when all pitches at the current `startTime` are hit

### MIDI file parsing

`src/lib/midiParser.js` exports `parseMidi(buffer, options)` which converts an `ArrayBuffer` (from a `.mid` file) into `NoteEvent[]`. Returns `{ notes, detectedBpm }` ready to use in `ExerciseConfig`.

### Adding a new exercise

Add an `ExerciseConfig` object to the `EXERCISES` array in `App.jsx`. The config controls all scaffold, panel, metric, fingering, and mode behaviour — no other files need changing for a new exercise.

---

## Key constants (`src/lib/constants.js`)

| Constant | Value | Meaning |
|----------|-------|---------|
| `BEAT_START_OFFSET` | `-2` | Lead-in beats before beat 0 |
| `TICK_FRACTION` | `0.05` | Beat increment per interval tick |
| `BEATS_TO_FALL` | `4` | Beats for a tile to fall to the keyboard |
| `TIMING_TOLERANCE_BEATS` | `0.25` | Window for "on time" note hits |
| `KEYBOARD_START_OCTAVE` | `2` | Default lowest octave (C2 = MIDI 36) |
| `KEYBOARD_OCTAVES` | `5` | Default number of octaves shown |
