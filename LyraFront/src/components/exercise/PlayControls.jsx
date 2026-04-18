/**
 * Play / Pause toggle button.
 *
 * @param {{ isPlaying: boolean, onToggle: function }} props
 */
export function PlayControls({ isPlaying, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="px-4 py-2 text-sm italic rounded"
      style={playBtnStyle(isPlaying)}
    >
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const playBtnStyle = (isPlaying) => ({
  backgroundColor: isPlaying ? 'var(--color-secondary)' : 'var(--color-accent)',
  color:           '#ffffff',
  border:          '1px solid var(--color-border)',
  fontFamily:      'inherit',
  cursor:          'pointer',
  fontWeight:      600,
  padding:         '0.5rem 1.25rem',
  borderRadius:    '999px',
  backdropFilter:  'blur(6px)',
  boxShadow:       '0 4px 12px rgba(0,0,0,0.2)',
})
