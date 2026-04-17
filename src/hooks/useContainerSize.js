import { useEffect, useRef, useState } from 'react'

/**
 * Observes a container element and returns its current pixel dimensions.
 * Updates whenever the element is resized.
 *
 * @returns {{ ref: React.RefObject, width: number, height: number }}
 */
export function useContainerSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    observer.observe(ref.current)

    // Read initial size immediately
    const { offsetWidth, offsetHeight } = ref.current
    setSize({ width: offsetWidth, height: offsetHeight })

    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}
