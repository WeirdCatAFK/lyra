/**
 * Transient hint text that appears above the keyboard when the user presses
 * an unexpected note. Fades in immediately, fades out when text is cleared.
 *
 * @param {{ text: string|null }} props
 */
export function NoteHint({ text }) {
  return (
    <div
      className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-30"
      style={hintContainerStyle(text)}
    >
      <span className="px-5 py-1.5 rounded-full italic" style={S.pill}>
        {text || ''}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const hintContainerStyle = (text) => ({
  opacity:    text ? 1 : 0,
  transform:  text ? 'translateY(0)' : 'translateY(4px)',
  transition: 'opacity 0.2s ease, transform 0.2s ease',
})

const S = {
  pill: {
    fontSize:        '0.95rem',
    color:           'var(--color-fg)',
    backgroundColor: 'var(--color-secondary)',
    border:          '1px solid var(--color-border)',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.08)',
  },
}
