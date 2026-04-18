import { useEffect, useRef, useState } from 'react'

// ─── PC Keyboard Mapping (Physical Codes) ──────────────────────────────────
// Mapping follows standard tracker/DAW layouts using physical codes.
// It mimics a piano by using the bottom rows for white keys and the 
// rows above them for black keys, with natural gaps where appropriate.

const BASE_KEY_MAP = {
  // --- Lower Row System (Lower Octave) ---
  'KeyZ': 0,  'KeyS': 1,  'KeyX': 2,  'KeyD': 3,  'KeyC': 4,
  'KeyV': 5,  'KeyG': 6,  'KeyB': 7,  'KeyH': 8,  'KeyN': 9,  'KeyJ': 10, 'KeyM': 11,
  'Comma': 12, 'KeyL': 13, 'Period': 14, 'Semicolon': 15, 'Slash': 16,

  // --- Upper Row System (Upper Octave, starts at Middle C = 12) ---
  'KeyQ': 12, 'Digit2': 13, 'KeyW': 14, 'Digit3': 15, 'KeyE': 16,
  'KeyR': 17, 'Digit5': 18, 'KeyT': 19, 'Digit6': 20, 'KeyY': 21, 'Digit7': 22, 'KeyU': 23,
  'KeyI': 24, 'Digit9': 25, 'KeyO': 26, 'Digit0': 27, 'KeyP': 28, 'BracketLeft': 29, 
  'Equal': 30, 'BracketRight': 31,
}

/**
 * Connects to any available MIDI input devices via the Web MIDI API.
 * Falls back to PC keyboard if no MIDI device is present.
 * Supports octave shifting with '+' and '-' keys.
 *
 * @param {{ onNoteOn?: function(number, number): void, onNoteOff?: function(number): void }} [callbacks]
 * @returns {{
 *   pressedNotes: Set<number>,
 *   devices: string[],
 *   isConnected: boolean,
 *   keyboardActive: boolean,
 *   octaveOffset: number,
 *   error: string|null
 * }}
 */
export function useWebMidi(callbacks = {}) {
  const [pressedNotes, setPressedNotes] = useState(new Set())
  const [devices, setDevices]           = useState([])
  const [octaveOffset, setOctaveOffset] = useState(5) // Translated one octave up
  const [error, setError]               = useState(null)

  const callbacksRef = useRef(callbacks)
  useEffect(() => { callbacksRef.current = callbacks }, [callbacks])

  const heldNotesRef = useRef(new Set())
  const isConnected = devices.length > 0
  const keyboardActive = !isConnected

  // ─── Keyboard handlers ───────────────────────────────────────────────────

  useEffect(() => {
    if (!keyboardActive) return

    const handleKeyDown = (e) => {
      if (e.repeat) return

      // Octave shifting
      if (e.key === '+' || e.key === '=') {
        setOctaveOffset((prev) => Math.min(prev + 1, 8))
        return
      }
      if (e.key === '-' || e.key === '_') {
        setOctaveOffset((prev) => Math.max(prev - 1, 0))
        return
      }

      const offset = BASE_KEY_MAP[e.code]
      if (offset !== undefined) {
        const pitch = octaveOffset * 12 + offset
        if (!heldNotesRef.current.has(pitch)) {
          heldNotesRef.current.add(pitch)
          callbacksRef.current.onNoteOn?.(pitch, 0.7)
          setPressedNotes((prev) => new Set(prev).add(pitch))
        }
      }
    }

    const handleKeyUp = (e) => {
      const offset = BASE_KEY_MAP[e.code]
      if (offset !== undefined) {
        const pitch = octaveOffset * 12 + offset
        if (heldNotesRef.current.has(pitch)) {
          heldNotesRef.current.delete(pitch)
          callbacksRef.current.onNoteOff?.(pitch)
          setPressedNotes((prev) => {
            const next = new Set(prev)
            next.delete(pitch)
            return next
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [keyboardActive, octaveOffset])

  // ─── MIDI Setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setError('not supported')
      return
    }

    let midiAccess = null

    function attachInputs(access) {
      const names = []
      access.inputs.forEach((input) => {
        input.onmidimessage = handleMidiMessage
        names.push(input.name)
      })
      setDevices(names)
    }

    navigator.requestMIDIAccess().then((access) => {
      midiAccess = access
      attachInputs(access)

      access.onstatechange = () => {
        attachInputs(access)
        heldNotesRef.current = new Set()
        setPressedNotes(new Set())
      }
    }).catch((err) => {
      setError(err.message ?? 'permission denied')
    })

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => { input.onmidimessage = null })
        midiAccess.onstatechange = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { pressedNotes, devices, isConnected, keyboardActive, error }
}
