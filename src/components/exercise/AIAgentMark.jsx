/**
 * AIAgentMark — abstract ink-splash in vermillion.
 * A neutral visual indicator that the system is speaking.
 *
 * @param {{ size?: number }} props
 */
export function AIAgentMark({ size = 50 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M50 42c3-8 8-18 12-24 1 8 0 16-2 22 6-4 14-8 22-9-6 5-12 10-16 16 8-1 17 1 24 4-8 3-16 4-22 4 5 5 10 12 12 20-5-5-11-10-16-12 0 7-2 15-6 22 0-8-3-16-6-22-4 5-10 11-16 14 4-6 6-14 7-21-7 3-15 4-22 3 7-4 14-8 19-13-7-1-15-4-21-8 8 1 16 1 22 0-3-6-5-13-5-21 4 7 8 14 14 20z"
        fill="#d94a2c"
        style={S.inkPath}
      />
      <circle cx="18" cy="35" r="2.5" fill="#d94a2c" opacity="0.8" />
      <circle cx="82" cy="28" r="1.8" fill="#d94a2c" opacity="0.7" />
      <circle cx="25" cy="72" r="2"   fill="#d94a2c" opacity="0.75" />
      <circle cx="78" cy="68" r="2.2" fill="#d94a2c" opacity="0.85" />
      <circle cx="35" cy="18" r="1.5" fill="#d94a2c" opacity="0.6" />
      <circle cx="68" cy="82" r="1.8" fill="#d94a2c" opacity="0.65" />
      <circle cx="12" cy="52" r="1.3" fill="#d94a2c" opacity="0.5" />
      <circle cx="88" cy="48" r="1.6" fill="#d94a2c" opacity="0.55" />
      <ellipse cx="42" cy="25" rx="1.2" ry="0.8" fill="#d94a2c" opacity="0.4" />
      <ellipse cx="62" cy="75" rx="1"   ry="1.4" fill="#d94a2c" opacity="0.45" />
      <ellipse cx="28" cy="58" rx="0.9" ry="1.1" fill="#d94a2c" opacity="0.35" />
      <defs>
        <filter id="inkBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  inkPath: { filter: 'url(#inkBlur)' },
}
