import { useEffect, useRef, useState } from 'react'
import { BEAT_START_OFFSET, TICK_FRACTION } from '../lib/constants.js'

/**
 * Beat-based playback engine.
 *
 * Two modes:
 *   'free' (default) — advances currentBeat by TICK_FRACTION on a timer.
 *   'step'           — beat never advances automatically; call stepBeat(targetBeat)
 *                      from outside (e.g. when the correct note is played).
 *
 * @param {number} bpm
 * @param {number} loopEndBeat
 * @param {{ onLoopEnd?: function, mode?: 'free'|'step' }} [options]
 * @returns {{ currentBeat, isPlaying, toggle, reset, stop, stepBeat }}
 */
export function usePlaybackEngine(bpm, loopEndBeat, options = {}) {
  const { onLoopEnd, mode = 'free' } = options
  const [currentBeat, setCurrentBeat] = useState(BEAT_START_OFFSET)
  const [isPlaying, setIsPlaying]     = useState(false)

  const onLoopEndRef = useRef(onLoopEnd)
  useEffect(() => { onLoopEndRef.current = onLoopEnd }, [onLoopEnd])

  // Free mode only — timer-driven beat advancement
  useEffect(() => {
    if (!isPlaying || mode === 'step') return

    const msPerBeat  = (60 / bpm) * 1000
    const intervalMs = msPerBeat * TICK_FRACTION

    const id = setInterval(() => {
      setCurrentBeat((prev) => {
        if (prev > loopEndBeat) {
          onLoopEndRef.current?.()
          return BEAT_START_OFFSET
        }
        return prev + TICK_FRACTION
      })
    }, intervalMs)

    return () => clearInterval(id)
  }, [bpm, isPlaying, loopEndBeat, mode])

  function toggle() { setIsPlaying((p) => !p) }
  function reset()  { setCurrentBeat(BEAT_START_OFFSET) }

  function stop() {
    setIsPlaying(false)
    setCurrentBeat(BEAT_START_OFFSET)
  }

  /**
   * Step mode only — jump currentBeat to targetBeat.
   * If targetBeat exceeds loopEndBeat, triggers onLoopEnd and stops playback.
   * Safe to call in free mode (no-op effectively, but avoid it).
   */
  function stepBeat(targetBeat) {
    if (targetBeat > loopEndBeat) {
      onLoopEndRef.current?.()
      setIsPlaying(false)
      setCurrentBeat(BEAT_START_OFFSET)
    } else {
      setCurrentBeat(targetBeat)
    }
  }

  return { currentBeat, isPlaying, toggle, reset, stop, stepBeat }
}
