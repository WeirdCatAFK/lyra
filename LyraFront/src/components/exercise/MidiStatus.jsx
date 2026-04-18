/**
 * Small MIDI connection indicator.
 * Shows the first connected device name, or a neutral "no device" state.
 *
 * @param {{
 *   devices: string[],
 *   isConnected: boolean,
 *   keyboardActive: boolean,
 *   octaveOffset: number,
 *   error: string|null
 * }} props
 */
export function MidiStatus({ devices, isConnected, keyboardActive, octaveOffset, error }) {
  const label = error
    ? 'MIDI unavailable'
    : isConnected
      ? devices[0]
      : keyboardActive
        ? `Teclado PC (C${octaveOffset})`
        : 'No MIDI device'

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block rounded-full" style={dotStyle(isConnected, keyboardActive)} />
      <span className="text-xs italic" style={S.label}>
        {label}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const dotStyle = (isConnected, keyboardActive) => ({
  width:           8,
  height:          8,
  backgroundColor: isConnected ? '#4caf50' : (keyboardActive ? '#2196f3' : 'var(--color-border)'),
  flexShrink:      0,
})

const S = {
  label: { color: 'var(--color-muted)' },
}
