import { useState, useCallback } from 'react';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const play = useCallback(async (text) => {
    if (!text || isPlaying) return;
    if (!ELEVENLABS_API_KEY) {
      setError("VITE_ELEVENLABS_API_KEY no está configurada");
      return;
    }

    setIsPlaying(true);
    setError(null);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const headers = {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    };
    const body = JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error(`Error de red: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setError('No se pudo reproducir el audio.');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();

    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
    }
  }, [isPlaying]);

  return { play, isPlaying, error };
};

export default useTextToSpeech;
