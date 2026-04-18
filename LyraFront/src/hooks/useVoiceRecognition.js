import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceRecognition = () => {
  const [isListening, setIsListening]         = useState(false);
  const [transcript, setTranscript]           = useState('');       // final utterances — wake-word trigger
  const [interimTranscript, setInterim]       = useState('');       // live partial results for display
  const [status, setStatus]                   = useState('idle');   // 'idle' | 'starting' | 'listening' | 'error' | 'unsupported'
  const [errorMessage, setErrorMessage]       = useState('');
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const statusRef = useRef('idle');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API no soportada (usa Chrome o Edge).');
      statusRef.current = 'unsupported';
      setStatus('unsupported');
      setErrorMessage('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'es-ES';

    recognition.onstart = () => {
      setIsListening(true);
      statusRef.current = 'listening';
      setStatus('listening');
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else            interim   += r[0].transcript;
      }
      setInterim(interim.trim());
      if (finalText) {
        setTranscript(finalText.trim());
        setInterim('');
      }
    };

    recognition.onerror = (event) => {
      console.warn('Reconocimiento de voz (error):', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
        statusRef.current = 'error';
        setStatus('error');
        setErrorMessage('Permiso de micrófono denegado. Actívalo en la configuración del navegador.');
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Benign — let onend handle the auto-restart.
      } else {
        statusRef.current = 'error';
        setStatus('error');
        setErrorMessage(`Error de micrófono: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        // Web Speech auto-ends every ~60s; restart silently without flipping
        // isListening/status so the pill doesn't flash "Iniciando..." every minute.
        try {
          recognition.start();
        } catch (err) {
          setIsListening(false);
          statusRef.current = 'idle';
          setStatus('idle');
          console.warn('No se pudo reiniciar el reconocimiento:', err);
        }
      } else {
        setIsListening(false);
        statusRef.current = 'idle';
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try { recognition.stop(); } catch { /* noop */ }
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (statusRef.current === 'unsupported' || statusRef.current === 'error') return;
    shouldListenRef.current = true;
    try {
      recognition.start();
      // Only flip to 'starting' on the very first boot — later calls are no-ops
      // while already running, so don't churn status.
      if (statusRef.current === 'idle') {
        statusRef.current = 'starting';
        setStatus('starting');
      }
    } catch {
      // Already running — safe to ignore.
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    shouldListenRef.current = false;
    try { recognition.stop(); } catch { /* noop */ }
    setIsListening(false);
    setTranscript('');
    setInterim('');
    statusRef.current = 'idle';
    setStatus('idle');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterim('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    status,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useVoiceRecognition;
