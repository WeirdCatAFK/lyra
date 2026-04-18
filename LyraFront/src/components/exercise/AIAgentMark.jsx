import luma from '../../assets/luma.png'

/**
 * AIAgentMark — Luma mascot.
 *
 * @param {{ size?: number }} props
 */
export function AIAgentMark({ size = 50 }) {
  return (
    <img
      src={luma}
      alt="Luma"
      width={size}
      height={size}
      style={S.img}
      draggable={false}
    />
  )
}

const S = {
  img: {
    objectFit: 'contain',
    filter:    'drop-shadow(0 6px 14px rgba(0,0,0,0.25))',
    userSelect: 'none',
  },
}
