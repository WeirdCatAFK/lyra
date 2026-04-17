/**
 * Small MIDI connection indicator.
 * Shows the first connected device name, or a neutral "no device" state.
 *
 * @param {{ devices: string[], isConnected: boolean, error: string|null }} props
 */
export function MidiStatus({ devices, isConnected, error }) {
  const label = error
    ? 'MIDI unavailable'
    : isConnected
      ? devices[0]
      : 'No MIDI device'

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block rounded-full" style={dotStyle(isConnected)} />
      <span className="text-xs italic" style={S.label}>
        {label}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const dotStyle = (isConnected) => ({
  width:           8,
  height:          8,
  backgroundColor: isConnected ? '#4caf50' : 'var(--color-border)',
  flexShrink:      0,
})

const S = {
  label: { color: 'var(--color-muted)' },
}
