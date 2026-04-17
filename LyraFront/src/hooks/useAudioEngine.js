import { useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'

const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'

const SALAMANDER_SAMPLES = {
  A0:  'A0.mp3',
  C1:  'C1.mp3',  'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  A1:  'A1.mp3',
  C2:  'C2.mp3',  'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  A2:  'A2.mp3',
  C3:  'C3.mp3',  'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  A3:  'A3.mp3',
  C4:  'C4.mp3',  'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  A4:  'A4.mp3',
  C5:  'C5.mp3',  'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  A5:  'A5.mp3',
  C6:  'C6.mp3',  'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  A6:  'A6.mp3',
  C7:  'C7.mp3',  'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
  A7:  'A7.mp3',
  C8:  'C8.mp3',
}

/**
 * Tone.js Sampler engine using Salamander Grand Piano V3 samples.
 *
 * Sampler is created on mount and disposed on unmount. The AudioContext is
 * resumed on first use (required after user gesture).
 *
 * @returns {{ playNote: function, playClick: function }}
 */
export function useAudioEngine() {
  const samplerRef = useRef(null)

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls:    SALAMANDER_SAMPLES,
      baseUrl: SALAMANDER_BASE,
    }).toDestination()
    samplerRef.current = sampler
    return () => sampler.dispose()
  }, [])

  const playNote = useCallback((pitch, velocity = 0.7) => {
    Tone.start()
    if (!samplerRef.current?.loaded) return
    const note = Tone.Frequency(pitch, 'midi').toNote()
    samplerRef.current.triggerAttackRelease(note, 2, Tone.now(), velocity)
  }, [])

  const playClick = useCallback((isAccent = false) => {
    Tone.start()
    const ctx = Tone.getContext().rawContext
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = isAccent ? 1050 : 750

    const env = ctx.createGain()
    env.gain.setValueAtTime(isAccent ? 0.35 : 0.2, now)
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)

    osc.connect(env)
    env.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.055)
  }, [])

  return { playNote, playClick }
}
