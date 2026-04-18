import { useEffect, useState } from 'react'

const ADVANCE_DELAY_MS = 5000

/**
 * Full-screen overlay shown after an exercise loop completes.
 * Displays per-metric scores and an optional improvement delta.
 * Auto-advances after ADVANCE_DELAY_MS; the "Siguiente" button skips the wait.
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
    const tick = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000)
    const go   = setTimeout(onNext, autoMs)
    return () => { clearInterval(tick); clearTimeout(go) }
  }, [result, autoMs, onNext])

  if (!result) return null

  const overall = result.metrics.length
    ? result.metrics.reduce((sum, m) => sum + m.value * (m.difficulty ?? 1), 0) /
      result.metrics.reduce((sum, m) => sum + (m.difficulty ?? 1), 0)
    : null

  const overallPct = overall !== null ? Math.round(overall * 100) : null
  const verdict = overallPct === null ? null
    : overallPct >= 85 ? '¡Excelente!'
    : overallPct >= 70 ? 'Buen trabajo'
    : overallPct >= 50 ? 'Sigue practicando'
    : 'Vuelve a intentarlo'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={S.backdrop}>
      <div style={S.card}>

        <header style={S.header}>
          <p style={S.eyebrow}>Sesión completada</p>
          <h2 style={S.title}>{verdict ?? 'Ejercicio completado'}</h2>
          {result.exerciseId && (
            <p style={S.exerciseId}>Ejercicio · {result.exerciseId}</p>
          )}
        </header>

        {overallPct !== null && (
          <div style={S.overallCard}>
            <div style={S.overallTop}>
              <span style={S.overallLabel}>Puntuación total</span>
              <span style={S.overallValue}>{overallPct}<span style={S.overallUnit}>%</span></span>
            </div>
            <ProgressBar value={overall} thick />
          </div>
        )}

        {result.metrics.length > 0 && (
          <div style={S.metricsList}>
            {result.metrics.map((m) => (
              <MetricRow key={m.label} metric={m} />
            ))}
          </div>
        )}

        <div style={S.footer}>
          <button onClick={onNext} style={S.nextBtn}>
            Siguiente ejercicio
            <span style={S.countdown}>{countdown}s</span>
          </button>
          <p style={S.hint}>Avanza automáticamente</p>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ metric }) {
  const pct   = Math.round(metric.value * 100)
  const delta = metric.delta

  return (
    <div style={S.metricRow}>
      <div style={S.metricHeader}>
        <span style={S.metricLabel}>{prettyLabel(metric.label)}</span>
        <div style={S.metricRight}>
          {delta != null && (
            <span style={deltaStyle(delta)}>
              {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(0)}
            </span>
          )}
          <span style={S.metricValue}>{pct}%</span>
        </div>
      </div>
      <ProgressBar value={metric.value} />
    </div>
  )
}

function ProgressBar({ value, thick = false }) {
  return (
    <div style={thick ? S.progressTrackThick : S.progressTrack}>
      <div style={progressFillStyle(value, thick)} />
    </div>
  )
}

function prettyLabel(label) {
  return String(label)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAVY = '#021a54'
const PINK = '#ff5fa2'
const PINK_SOFT = '#ff85bb'

const S = {
  backdrop: {
    background:
      'radial-gradient(ellipse 70% 55% at 50% 55%, rgba(255, 133, 187, 0.55) 0%, rgba(255, 133, 187, 0.25) 35%, rgba(2, 26, 84, 0.92) 70%), rgba(2, 26, 84, 0.92)',
    backdropFilter: 'blur(8px)',
  },
  card: {
    width: '92%',
    maxWidth: 520,
    background: '#ffffff',
    borderRadius: 18,
    padding: '2rem 2.25rem',
    boxShadow: '0 24px 60px rgba(2, 26, 84, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    color: NAVY,
    fontFamily: 'Poppins, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '0.75rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: PINK,
    fontWeight: 600,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: NAVY,
    lineHeight: 1.15,
  },
  exerciseId: {
    fontSize: '0.8rem',
    color: 'rgba(2, 26, 84, 0.55)',
    marginTop: '0.25rem',
  },
  overallCard: {
    background: 'linear-gradient(135deg, rgba(255, 95, 162, 0.10), rgba(2, 26, 84, 0.06))',
    border: '1px solid rgba(2, 26, 84, 0.08)',
    borderRadius: 12,
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  overallTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  overallLabel: {
    fontSize: '0.85rem',
    color: 'rgba(2, 26, 84, 0.65)',
    fontWeight: 500,
  },
  overallValue: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: NAVY,
    lineHeight: 1,
  },
  overallUnit: {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'rgba(2, 26, 84, 0.5)',
    marginLeft: 2,
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: 'rgba(2, 26, 84, 0.7)',
    fontWeight: 500,
  },
  metricRight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.6rem',
  },
  metricValue: {
    fontSize: '0.95rem',
    color: NAVY,
    fontWeight: 600,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(2, 26, 84, 0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressTrackThick: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(2, 26, 84, 0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid rgba(2, 26, 84, 0.08)',
  },
  nextBtn: {
    width: '100%',
    background: PINK,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '0.85rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'Poppins, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  countdown: {
    fontSize: '0.78rem',
    fontWeight: 500,
    background: 'rgba(255, 255, 255, 0.22)',
    padding: '0.18rem 0.55rem',
    borderRadius: 999,
  },
  hint: {
    fontSize: '0.72rem',
    color: 'rgba(2, 26, 84, 0.45)',
    letterSpacing: '0.02em',
  },
}

const deltaStyle = (delta) => ({
  fontSize: '0.78rem',
  color: delta >= 0 ? '#1e7a4a' : '#c03820',
  fontWeight: 600,
  background: delta >= 0 ? 'rgba(30, 122, 74, 0.10)' : 'rgba(192, 56, 32, 0.10)',
  padding: '0.1rem 0.45rem',
  borderRadius: 999,
})

const progressFillStyle = (value, thick) => ({
  width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
  height: '100%',
  background: `linear-gradient(90deg, ${PINK}, ${PINK_SOFT})`,
  borderRadius: 999,
  transition: 'width 0.6s ease',
  boxShadow: thick ? '0 0 12px rgba(255, 95, 162, 0.4)' : 'none',
})
