import { useEffect, useRef, useState } from 'react'

const TYPE_COLORS = {
  exercise: '#7ec8a4',
  beat:     '#888888',
  note_on:  '#d9a44a',
  hint:     '#d94a2c',
  result:   '#7ab0c0',
  step:     '#b07ae0',
}

const PANEL = {
  bg:     'rgba(10,10,10,0.86)',
  border: 'rgba(255,255,255,0.08)',
  muted:  'rgba(255,255,255,0.3)',
  text:   'rgba(255,255,255,0.75)',
  dim:    'rgba(255,255,255,0.2)',
}

/**
 * Floating dev log panel.
 *
 * @param {{
 *   entries:            Array,
 *   onClear:            function,
 *   exercises?:         import('../lib/constants').ExerciseConfig[],
 *   currentIndex?:      number,
 *   onSelectExercise?:  function(index: number): void,
 * }} props
 */
export function DevLog({ entries, onClear, exercises = [], currentIndex = 0, onSelectExercise }) {
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, minimized])

  return (
    <div className="absolute left-4 bottom-4 z-40 flex flex-col" style={panelStyle(minimized)}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3" style={headerStyle(minimized)}>
        <span style={S.headerLabel}>dev log</span>
        <span style={S.spacer} />
        <button onClick={onClear} style={S.btn}>clear</button>
        <button
          onClick={() => setMinimized((m) => !m)}
          title={minimized ? 'expand' : 'minimise'}
          style={S.toggleBtn}
        >
          {minimized ? '＋' : '－'}
        </button>
      </div>

      {/* ── Exercise selector ──────────────────────────────────────────── */}
      {!minimized && exercises.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2" style={S.selectorRow}>
          <span style={S.selectorLabel}>ex:</span>
          {exercises.map((ex, i) => {
            const label    = ex.id ?? ex.exerciseInstruction ?? `#${i + 1}`
            const isActive = i === currentIndex
            return (
              <button
                key={i}
                onClick={() => onSelectExercise?.(i)}
                style={exPillStyle(isActive)}
                title={label}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Log entries ────────────────────────────────────────────────── */}
      {!minimized && (
        <div className="overflow-y-auto flex-1 px-2 py-1" style={S.logScroll}>
          {entries.length === 0 && (
            <p style={S.emptyMsg}>waiting for events…</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="flex gap-2 items-start py-0.5">
              <span style={entryTypeStyle(e.type)}>
                {e.label}
              </span>
              {e.beat !== null && (
                <span style={S.entryBeat}>{e.beat.toFixed(2)}</span>
              )}
              <span style={S.entryMsg}>{e.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const panelStyle = (minimized) => ({
  width:           330,
  backgroundColor: PANEL.bg,
  backdropFilter:  'blur(4px)',
  borderRadius:    6,
  border:          `1px solid ${PANEL.border}`,
  fontFamily:      'monospace',
  fontSize:        11,
  overflow:        'hidden',
  maxHeight:       minimized ? 32 : 320,
  transition:      'max-height 0.2s ease',
})

const headerStyle = (minimized) => ({
  height:       32,
  borderBottom: minimized ? 'none' : `1px solid ${PANEL.border}`,
  color:        PANEL.muted,
  flexShrink:   0,
})

const exPillStyle = (isActive) => ({
  background:   isActive ? 'rgba(217,74,44,0.7)' : 'rgba(255,255,255,0.07)',
  border:       `1px solid ${isActive ? 'rgba(217,74,44,0.9)' : PANEL.border}`,
  borderRadius: 3,
  color:        isActive ? '#fff' : PANEL.text,
  cursor:       'pointer',
  fontFamily:   'monospace',
  fontSize:     10,
  padding:      '2px 7px',
  transition:   'background 0.15s',
  maxWidth:     120,
  overflow:     'hidden',
  textOverflow: 'ellipsis',
  whiteSpace:   'nowrap',
})

const entryTypeStyle = (type) => ({
  color:      TYPE_COLORS[type] ?? '#aaa',
  minWidth:   20,
  fontWeight: 700,
  flexShrink: 0,
})

const S = {
  headerLabel: { fontWeight: 700, letterSpacing: '0.05em' },
  spacer:      { flex: 1 },
  btn: {
    background: 'none',
    border:     'none',
    color:      PANEL.muted,
    cursor:     'pointer',
    fontSize:   11,
    padding:    '0 2px',
  },
  toggleBtn: {
    background:  'none',
    border:      'none',
    color:       PANEL.muted,
    cursor:      'pointer',
    fontSize:    14,
    lineHeight:  1,
    padding:     '0 2px',
  },
  selectorRow:  { borderBottom: `1px solid ${PANEL.border}` },
  selectorLabel:{ color: PANEL.dim, alignSelf: 'center', marginRight: 2 },
  logScroll:    { scrollbarWidth: 'thin', maxHeight: 220 },
  emptyMsg:     { color: PANEL.dim, padding: '4px 4px' },
  entryBeat:    { color: PANEL.dim, minWidth: 36, flexShrink: 0 },
  entryMsg:     { color: PANEL.text, wordBreak: 'break-all' },
}
