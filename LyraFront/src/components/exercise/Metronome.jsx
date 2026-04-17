/**
 * Metronome — pyramid body with swinging pendulum arm.
 *
 * armAngle is derived from currentBeat so the pendulum is always in sync with
 * playback. One full swing (left → right → left) takes two beats.
 *
 * @param {{ bpm: number, isPlaying: boolean, currentBeat: number }} props
 */
export function Metronome({ bpm, isPlaying, currentBeat }) {
  const armAngle = isPlaying ? Math.sin(currentBeat * Math.PI) * 25 : 0

  return (
    <div className="flex items-end gap-3">
      <svg viewBox="0 0 60 100" className="w-10 h-16" style={S.svg}>
        {/* Body */}
        <path d="M10 95 L30 10 L50 95 Z" fill="none" stroke="var(--color-fg)" strokeWidth="2" strokeLinejoin="round" />
        {/* Base */}
        <rect x="5" y="93" width="50" height="5" fill="none" stroke="var(--color-fg)" strokeWidth="2" rx="1" />
        {/* Pivot */}
        <circle cx="30" cy="75" r="3" fill="var(--color-fg)" />
        {/* Arm */}
        <g style={armStyle(armAngle, isPlaying)}>
          <line x1="30" y1="75" x2="30" y2="20" stroke="var(--color-fg)" strokeWidth="2" />
          <rect x="24" y="35" width="12" height="8" fill="var(--color-fg)" rx="1" />
        </g>
        {/* Decoration */}
        <line x1="20" y1="70" x2="40" y2="70" stroke="var(--color-fg)" strokeWidth="1" opacity="0.5" />
        <line x1="22" y1="60" x2="38" y2="60" stroke="var(--color-fg)" strokeWidth="1" opacity="0.3" />
      </svg>
      <span className="text-lg italic" style={S.tempo}>
        {bpm}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  svg:   { overflow: 'visible' },
  tempo: { color: 'var(--color-fg)' },
}

const armStyle = (armAngle, isPlaying) => ({
  transformOrigin: '30px 75px',
  transform:       `rotate(${armAngle}deg)`,
  transition:      isPlaying ? 'transform 0.1s linear' : 'transform 0.3s ease-out',
})
