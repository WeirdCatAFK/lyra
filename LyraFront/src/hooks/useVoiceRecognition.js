import { useState, useEffect, useCallback } from 'react';

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Web Speech API is not supported by this browser.");
      setStatus('unsupported');
      setErrorMessage('Este navegador no soporta reconocimiento de voz.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'es-ES';
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setErrorMessage('');
    };

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const currentTranscript = `${finalTranscript}${interimTranscript}`.trim();
      if (currentTranscript) {
        setLiveTranscript(currentTranscript);
        setTranscript(currentTranscript);
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setStatus('idle');
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setStatus('error');
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setErrorMessage('Permiso de micrófono denegado. Actívalo en el navegador.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No se detectó voz. Intenta hablar un poco más cerca del micrófono.');
      } else {
        setErrorMessage(`Error de reconocimiento: ${event.error}`);
      }
    };

    setRecognition(recognitionInstance);
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setStatus('starting');
      setErrorMessage('');
      try {
        recognition.start();
      } catch (error) {
        setStatus('error');
        setErrorMessage('No se pudo iniciar el micrófono.');
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return {
    isListening,
    transcript,
    liveTranscript,
    status,
    errorMessage,
    startListening,
    stopListening,
    setTranscript
  };
};

export default useVoiceRecognition;
