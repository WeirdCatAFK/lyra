import React, { useEffect, useState } from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech';
import './AIAssistant.css';

const AIAssistant = ({
  onClick,
  isOpen,
  onOpenChange,
  transcript,
  interimTranscript,
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
  const [isStatusCollapsed, setIsStatusCollapsed] = useState(() => {
    try { return localStorage.getItem('lyra_voice_status_collapsed') === '1'; }
    catch { return false; }
  });
  const { play: playAudio, isPlaying: isBotSpeaking } = useTextToSpeech();
  const liveTranscript = (interimTranscript?.trim() || transcript.trim());

  const toggleStatusCollapsed = () => {
    setIsStatusCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('lyra_voice_status_collapsed', next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token-style trigger; voiceDraft snapshot is intentional
  }, [voiceSubmitToken]);

  return (
    <div>
      <div className={`ai-assistant ${isBotSpeaking ? 'speaking' : ''}`} onClick={toggleChat}>
        <img src="/src/assets/luma.png" alt="Lyra AI Assistant" />
      </div>
      {isStatusCollapsed ? (
        <button
          type="button"
          className="voice-status-collapsed"
          onClick={toggleStatusCollapsed}
          title="Mostrar estado del micrófono"
          aria-label="Mostrar estado del micrófono"
        >
          <span className={`voice-status-dot ${isListening ? 'listening' : status === 'error' ? 'error' : ''}`} />
          <span className="voice-status-collapsed-label">{listeningLabel}</span>
        </button>
      ) : (
        <div className="voice-status" aria-live="polite">
          <div className="voice-status-header">
            <div className="voice-status-title">{listeningLabel}</div>
            <button
              type="button"
              className="voice-status-collapse-btn"
              onClick={toggleStatusCollapsed}
              title="Minimizar"
              aria-label="Minimizar estado del micrófono"
            >
              −
            </button>
          </div>
          <div className="voice-status-text">
            {liveTranscript
              || (status === 'idle'
                ? 'Haz clic en el asistente para activar el micrófono.'
                : 'Di “Lyra” para abrir el asistente.')}
          </div>
          {errorMessage && <div className="voice-status-error">{errorMessage}</div>}
        </div>
      )}
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
