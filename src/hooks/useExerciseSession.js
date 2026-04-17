import { useState, useCallback } from 'react'

/**
 * Manages a sequential queue of exercises.
 *
 * Wraps each exercise's onComplete so results are captured here.
 * Exposes `isTransitioning` (result overlay visible) and `advance` (move to
 * next exercise). Loops back to the first exercise after the last one.
 *
 * @param {import('../lib/constants').ExerciseConfig[]} exercises
 * @returns {{
 *   currentConfig:   import('../lib/constants').ExerciseConfig,
 *   index:           number,
 *   total:           number,
 *   lastResult:      import('../lib/constants').ExerciseResult|null,
 *   isTransitioning: boolean,
 *   advance:         function,
 * }}
 */
export function useExerciseSession(exercises) {
  const [index, setIndex]               = useState(0)
  const [lastResult, setLastResult]     = useState(null)
  const [isTransitioning, setTransition] = useState(false)

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % exercises.length)
    setLastResult(null)
    setTransition(false)
  }, [exercises.length])

  /** Jump directly to exercise at position i (wraps). */
  const jumpTo = useCallback((i) => {
    setIndex(((i % exercises.length) + exercises.length) % exercises.length)
    setLastResult(null)
    setTransition(false)
  }, [exercises.length])

  const base = exercises[index] ?? exercises[0]

  const currentConfig = {
    ...base,
    onComplete(result) {
      base.onComplete?.(result)
      setLastResult(result)
      setTransition(true)
    },
  }

  return { currentConfig, index, total: exercises.length, lastResult, isTransitioning, advance, jumpTo }
}
