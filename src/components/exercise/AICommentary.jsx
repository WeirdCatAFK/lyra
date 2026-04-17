import { AIAgentMark } from './AIAgentMark.jsx'

/**
 * Top zone — AI agent mark with commentary lines and an optional instruction.
 *
 * @param {{
 *   lines?:       string[],
 *   instruction?: string,
 * }} props
 */
export function AICommentary({ lines = [], instruction }) {
  return (
    <div className="flex flex-col items-center pt-6 pb-4">
      <AIAgentMark size={84} />
      {lines.length > 0 && (
        <div className="flex flex-col items-center gap-1 mt-4 max-w-lg text-center">
          {lines.map((line, i) => (
            <p key={i} className="italic leading-relaxed" style={S.commentaryLine}>
              {line}
            </p>
          ))}
        </div>
      )}
      {instruction && (
        <p className="italic mt-3" style={S.instruction}>
          {instruction}
        </p>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  commentaryLine: { fontSize: '1.05rem', color: 'var(--color-fg)' },
  instruction:    { fontSize: '1.25rem', color: 'var(--color-muted)' },
}
