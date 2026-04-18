import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Verificar soporte del navegador
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("La Web Speech API no está soportada en este navegador (Usa Chrome o Edge).");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuración para dictado continuo y en español
    recognition.continuous = true;
    recognition.interimResults = false; // Solo procesar frases terminadas
    recognition.lang = 'es-ES';

    // Capturar cada frase hablada
    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        setTranscript(text); // Actualizar estado con la última frase completa
      }
    };

    // Manejo de errores
    recognition.onerror = (event) => {
      console.warn('Reconocimiento de voz (error/detenido):', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    // Si se apaga solo, intentar reactivarlo (si debería seguir escuchando)
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Intento de iniciar el micrófono falló (posiblemente ya estaba activo).");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript(''); // Limpiar transcripción al detener
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useVoiceRecognition;
