import React, { useEffect, useState } from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech';
import './AIAssistant.css';

const AIAssistant = ({
  onClick,
  isOpen,
  onOpenChange,
  transcript,
  isListening,
  status,
  errorMessage,
  onSendMessage,
  voiceDraft,
  voiceSubmitToken,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { play: playAudio, isPlaying: isBotSpeaking } = useTextToSpeech();
  const liveTranscript = transcript.trim();
  const listeningLabel = status === 'unsupported'
    ? 'No disponible'
    : status === 'error'
      ? 'Error de micrófono'
      : isListening
        ? 'Escuchando...'
        : status === 'starting'
          ? 'Iniciando...'
          : 'Micrófono inactivo';

  const toggleChat = () => {
    const nextIsOpen = !isOpen;
    onOpenChange(nextIsOpen);
    if (nextIsOpen) {
        onClick(); // Start listening when opening chat
    }
  };

  const submitMessage = async (textToSend) => {
    const cleanedText = textToSend.trim();
    if (!cleanedText || isSending) {
      return;
    }

    setIsSending(true);
    setMessages((prevMessages) => [...prevMessages, { text: cleanedText, sender: 'user' }]);

    try {
      const assistantText = await onSendMessage(cleanedText);
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages.push({
          text: assistantText || 'No recibí respuesta del asistente.',
          sender: 'ai',
        });
        return newMessages;
      });
      if (assistantText) {
        playAudio(assistantText);
      }
    } catch (error) {
      console.error("Error al contactar al asistente de IA:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: 'Lo siento, no pude procesar tu solicitud.',
          sender: 'ai',
        },
      ]);
      playAudio('Lo siento, no pude procesar tu solicitud.');
    } finally {
      setIsSending(false);
    }

    setInputValue('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    void submitMessage(inputValue);
  };

  useEffect(() => {
    setInputValue(voiceDraft || '');
  }, [voiceDraft]);

  useEffect(() => {
    if (!voiceSubmitToken) {
      return;
    }

    void submitMessage(voiceDraft || '');
  }, [voiceSubmitToken]);

  return (
    <div>
      <div className={`ai-assistant ${isBotSpeaking ? 'speaking' : ''}`} onClick={toggleChat}>
        <img src="/src/assets/luma.png" alt="Lyra AI Assistant" />
      </div>
      <div className="voice-status" aria-live="polite">
        <div className="voice-status-title">{listeningLabel}</div>
        <div className="voice-status-text">
          {liveTranscript || 'Di “Lira” para abrir el asistente.'}
        </div>
        {errorMessage && <div className="voice-status-error">{errorMessage}</div>}
      </div>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Lyra Assistant</h3>
            <span className="chat-listening-pill">{listeningLabel}</span>
            <button onClick={toggleChat} className="close-chat">X</button>
          </div>
          <div className="messages-list">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={isSending}
            />
            <button type="submit" disabled={isSending}>Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
