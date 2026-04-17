import { useEffect, useRef, useState } from 'react'

/**
 * Connects to any available MIDI input devices via the Web MIDI API.
 *
 * Returns the set of MIDI pitches currently held down, a list of connected
 * device names, and connection state. Handles device plug/unplug at runtime.
 *
 * Only available in browsers that support navigator.requestMIDIAccess
 * (Chromium-based browsers). Returns error: "not supported" on others.
 *
 * @param {{ onNoteOn?: function(number, number): void, onNoteOff?: function(number): void }} [callbacks]
 * @returns {{
 *   pressedNotes: Set<number>,
 *   devices: string[],
 *   isConnected: boolean,
 *   error: string|null
 * }}
 */
export function useWebMidi(callbacks = {}) {
  const [pressedNotes, setPressedNotes] = useState(new Set())
  const [devices, setDevices]           = useState([])
  const [error, setError]               = useState(null)

  const callbacksRef = useRef(callbacks)
  useEffect(() => { callbacksRef.current = callbacks }, [callbacks])

  // Tracks currently-held pitches synchronously to deduplicate duplicate note-ons.
  // Prevents double-firing when a device sends on multiple MIDI channels or when
  // React StrictMode attaches two listeners via its effect cleanup/re-run cycle.
  const heldNotesRef = useRef(new Set())

  // Stable MIDI message handler
  const handleMessage = (event) => {
    const [status, note, velocity] = event.data
    const isNoteOn  = (status & 0xf0) === 0x90 && velocity > 0
    const isNoteOff = (status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)

    if (isNoteOn) {
      if (!heldNotesRef.current.has(note)) {
        heldNotesRef.current.add(note)
        callbacksRef.current.onNoteOn?.(note, velocity / 127)
      }
      setPressedNotes((prev) => {
        const next = new Set(prev)
        next.add(note)
        return next
      })
    } else if (isNoteOff) {
      heldNotesRef.current.delete(note)
      callbacksRef.current.onNoteOff?.(note)
      setPressedNotes((prev) => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
    }
  }

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setError('not supported')
      return
    }

    let midiAccess = null

    function attachInputs(access) {
      const names = []
      access.inputs.forEach((input) => {
        input.onmidimessage = handleMessage
        names.push(input.name)
      })
      setDevices(names)
    }

    navigator.requestMIDIAccess().then((access) => {
      midiAccess = access
      attachInputs(access)

      access.onstatechange = () => {
        attachInputs(access)
        // Clear any notes that were held when a device disconnected
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

  const isConnected = devices.length > 0

  return { pressedNotes, devices, isConnected, error }
}
