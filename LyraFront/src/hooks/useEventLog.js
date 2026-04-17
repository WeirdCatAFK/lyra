import { useCallback, useRef, useState } from 'react'

const MAX_ENTRIES = 80

const TYPE_LABELS = {
  exercise: 'EX',
  beat:     'BT',
  note_on:  'ON',
  hint:     'HT',
  result:   'RE',
  step:     'ST',
}

/**
 * Lightweight event log for real-time exercise debugging.
 *
 * `emit(type, message, beat)` appends an entry. Entries are capped at
 * MAX_ENTRIES (oldest evicted). Each entry has a stable numeric id.
 *
 * Types: 'exercise' | 'beat' | 'note_on' | 'hint' | 'result'
 *
 * @returns {{
 *   entries: Array<{ id: number, type: string, label: string, message: string, beat: number|null, ts: number }>,
 *   emit:    function(type: string, message: string, beat?: number): void,
 *   clear:   function(): void,
 * }}
 */
export function useEventLog() {
  const [entries, setEntries] = useState([])
  const counterRef = useRef(0)

  const emit = useCallback((type, message, beat = null) => {
    const entry = {
      id:      ++counterRef.current,
      type,
      label:   TYPE_LABELS[type] ?? '??',
      message,
      beat,
      ts:      Date.now(),
    }
    setEntries((prev) => {
      const next = [...prev, entry]
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
    })
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  return { entries, emit, clear }
}
