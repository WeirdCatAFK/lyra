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
  color:           isPlaying ? 'var(--color-fg)'        : 'var(--color-bg)',
  border:          '1px solid var(--color-border)',
  fontFamily:      'inherit',
  cursor:          'pointer',
})
