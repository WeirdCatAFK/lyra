import { useEffect, useState } from 'react'

const ADVANCE_DELAY_MS = 5000

/**
 * Full-screen overlay shown after an exercise loop completes.
 * Displays per-metric scores and an optional improvement delta.
 * Auto-advances after ADVANCE_DELAY_MS; the "Next →" button skips the wait.
 *
 * @param {{
 *   result:   import('../lib/constants').ExerciseResult,
 *   onNext:   function,
 *   autoMs?:  number,
 * }} props
 */
export function ExerciseResultOverlay({ result, onNext, autoMs = ADVANCE_DELAY_MS }) {
  const [countdown, setCountdown] = useState(Math.round(autoMs / 1000))

  useEffect(() => {
    if (!result) return
    setCountdown(Math.round(autoMs / 1000))
    const tick = setInterval(() => setCountdown((n) => n - 1), 1000)
    const go   = setTimeout(onNext, autoMs)
    return () => { clearInterval(tick); clearTimeout(go) }
  }, [result, autoMs, onNext])

  if (!result) return null

  const overall = result.metrics.length
    ? result.metrics.reduce((sum, m) => sum + m.value * m.difficulty, 0) /
      result.metrics.reduce((sum, m) => sum + m.difficulty, 0)
    : null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={S.backdrop}>
      <div className="flex flex-col items-center gap-6 px-10 py-10 rounded-lg" style={S.card}>

        <div className="flex flex-col items-center gap-1">
          <h2 className="italic" style={S.title}>Exercise Complete</h2>
          {result.exerciseId && (
            <p style={S.exerciseId}>{result.exerciseId}</p>
          )}
        </div>

        {result.metrics.length > 0 && (
          <div className="flex flex-col gap-3 w-full">
            {result.metrics.map((m) => (
              <MetricRow key={m.label} metric={m} />
            ))}
          </div>
        )}

        {overall !== null && (
          <div className="flex flex-col items-center gap-1 w-full pt-2" style={S.overallSection}>
            <div className="flex justify-between w-full items-baseline">
              <span className="italic" style={S.overallLabel}>overall</span>
              <span style={S.overallValue}>{Math.round(overall * 100)}%</span>
            </div>
            <ProgressBar value={overall} color="var(--color-accent)" />
          </div>
        )}

        <button onClick={onNext} className="italic px-8 py-2 rounded" style={S.nextBtn}>
          Next Exercise → <span style={S.countdown}>({countdown}s)</span>
        </button>
      </div>
    </div>
  )
}

function MetricRow({ metric }) {
  const pct   = Math.round(metric.value * 100)
  const delta = metric.delta

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-baseline">
        <span className="italic" style={S.metricLabel}>{metric.label}</span>
        <div className="flex items-baseline gap-2">
          {delta != null && (
            <span style={deltaStyle(delta)}>
              {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(0)}
            </span>
          )}
          <span style={S.metricValue}>{pct}%</span>
        </div>
      </div>
      <ProgressBar value={metric.value} color="var(--color-accent)" opacity={0.7} />
    </div>
  )
}

function ProgressBar({ value, color, opacity = 1 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={S.progressTrack}>
      <div style={progressFillStyle(value, color, opacity)} />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  backdrop: {
    backgroundColor: 'rgba(245,237,224,0.88)',
    backdropFilter:  'blur(6px)',
  },
  card: {
    backgroundColor: 'var(--color-bg)',
    border:          '1px solid var(--color-border)',
    boxShadow:       '0 8px 40px rgba(0,0,0,0.12)',
    minWidth:        340,
    maxWidth:        480,
    width:           '90%',
  },
  title:         { fontSize: '1.6rem', color: 'var(--color-fg)' },
  exerciseId:    { fontSize: '0.85rem', color: 'var(--color-muted)' },
  overallSection:{ borderTop: '1px solid var(--color-border)' },
  overallLabel:  { color: 'var(--color-muted)', fontSize: '0.85rem' },
  overallValue:  { fontSize: '1.3rem', color: 'var(--color-fg)', fontWeight: 600 },
  nextBtn: {
    backgroundColor: 'var(--color-accent)',
    color:           '#fff',
    fontSize:        '1rem',
    border:          'none',
    cursor:          'pointer',
    letterSpacing:   '0.02em',
  },
  countdown:    { opacity: 0.7, fontSize: '0.8rem' },
  metricLabel:  { color: 'var(--color-muted)', fontSize: '0.85rem' },
  metricValue:  { fontSize: '1rem', color: 'var(--color-fg)', fontWeight: 600 },
  progressTrack:{ height: 6, backgroundColor: 'var(--color-secondary)' },
}

const deltaStyle = (delta) => ({
  fontSize:   '0.8rem',
  color:      delta >= 0 ? '#3a8a5a' : '#c03820',
  fontWeight: 600,
})

const progressFillStyle = (value, color, opacity) => ({
  width:           `${Math.round(value * 100)}%`,
  height:          '100%',
  backgroundColor: color,
  opacity,
  transition:      'width 0.6s ease',
  borderRadius:    '9999px',
})
