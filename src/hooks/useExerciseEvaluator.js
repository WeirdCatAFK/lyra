import { useRef } from 'react'

/**
 * Tracks MIDI notes played during an exercise and computes the exercise's own
 * metric definitions when the loop ends.
 *
 * The compute logic lives in each MetricDefinition — this hook is just the
 * runtime that collects input and calls them.
 *
 * @param {import('../lib/constants').NoteEvent[]} expectedNotes
 * @returns {{
 *   recordNote:    function(pitch: number, beat: number): void,
 *   computeResult: function(config: import('../lib/constants').ExerciseConfig): import('../lib/constants').ExerciseResult,
 *   reset:         function(): void
 * }}
 */
export function useExerciseEvaluator(expectedNotes) {
  // Stored in a ref so recording never triggers re-renders
  const playedRef = useRef([])

  /**
   * Record a note-on event at the given beat position.
   * Call this from the Web MIDI hook's onNoteOn callback while playing.
   *
   * @param {number} pitch
   * @param {number} beat - Current beat at the time the key was pressed
   */
  function recordNote(pitch, beat) {
    playedRef.current.push({ pitch, beat })
  }

  /**
   * Run all MetricDefinitions defined on the exercise and return the result.
   * Safe to call with no metrics defined — returns an empty metrics array.
   *
   * @param {import('../lib/constants').ExerciseConfig} config
   * @returns {import('../lib/constants').ExerciseResult}
   */
  function computeResult(config) {
    const played  = playedRef.current
    const defs    = config.metrics ?? []

    const metrics = defs.map((def) => ({
      label:      def.label,
      value:      def.compute(expectedNotes, played),
      difficulty: def.difficulty,
    }))

    return {
      exerciseId: config.id,
      metrics,
      completedAt: Date.now(),
    }
  }

  function reset() {
    playedRef.current = []
  }

  return { recordNote, computeResult, reset }
}
