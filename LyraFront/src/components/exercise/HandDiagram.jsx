/**
 * Finger positions as percentage offsets within the hand image container.
 * Left hand: pinky (5) on the left, thumb (1) on the right.
 * Right hand: thumb (1) on the left, pinky (5) on the right.
 */
const FINGER_POSITIONS = {
  left: [
    { finger: 5, left: 8,  top: 20 },
    { finger: 4, left: 24, top: 12 },
    { finger: 3, left: 46, top: 8  },
    { finger: 2, left: 68, top: 12 },
    { finger: 1, left: 80, top: 35 },
  ],
  right: [
    { finger: 1, left: 20, top: 35 },
    { finger: 2, left: 32, top: 12 },
    { finger: 3, left: 54, top: 8  },
    { finger: 4, left: 76, top: 12 },
    { finger: 5, left: 92, top: 20 },
  ],
}

/**
 * Hand diagram with overlaid finger numbers.
 * activeFinger is derived from the current fingeringMap in the orchestrator.
 *
 * @param {{
 *   side:          "left" | "right",
 *   activeFinger?: 1|2|3|4|5,
 * }} props
 */
export function HandDiagram({ side, activeFinger }) {
  const positions = FINGER_POSITIONS[side]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={S.imageContainer}>
        <img
          src={side === 'left' ? '/images/left-hand.svg' : '/images/right-hand.svg'}
          alt={`${side} hand`}
          style={S.img}
        />

        {positions.map(({ finger, left, top }) => {
          const isActive = activeFinger === finger
          return (
            <div
              key={finger}
              className="absolute flex items-center justify-center pointer-events-none"
              style={fingerPinStyle(left, top)}
            >
              {isActive && (
                <div className="absolute rounded-full" style={S.glowDot} />
              )}
              <span className="relative z-10 italic" style={fingerLabelStyle(isActive)}>
                {finger}
              </span>
            </div>
          )
        })}
      </div>
      <span className="text-xs italic" style={S.caption}>
        {side === 'left' ? 'Left Hand' : 'Right Hand'}
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  imageContainer: { width: 110, height: 130 },
  img:            { width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 },
  glowDot:        { width: 22, height: 22, backgroundColor: 'var(--color-accent)', opacity: 0.45 },
  caption:        { color: 'var(--color-muted)' },
}

const fingerPinStyle = (left, top) => ({
  left:      `${left}%`,
  top:       `${top}%`,
  transform: 'translate(-50%, -50%)',
  width:     20,
  height:    20,
})

const fingerLabelStyle = (isActive) => ({
  fontFamily: 'inherit',
  fontSize:   isActive ? '14px' : '11px',
  fontWeight: isActive ? 'bold' : 'normal',
  color:      'var(--color-accent)',
})
