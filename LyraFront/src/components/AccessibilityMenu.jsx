import React, { useState, useEffect } from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech';
import './AccessibilityMenu.css';

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const { play } = useTextToSpeech();

  // Handle High Contrast
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
      if (readAloud) play('Modo de alto contraste activado');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Handle Large Text
  useEffect(() => {
    if (largeText) {
      document.body.classList.add('large-text');
      if (readAloud) play('Texto grande activado');
    } else {
      document.body.classList.remove('large-text');
    }
  }, [largeText]);

  // Handle Read Aloud
  useEffect(() => {
    if (readAloud) {
      play('Modo de lectura en voz alta activado. Pasará por algunos elementos importantes.');
    }
  }, [readAloud]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen && readAloud) {
      play('Menú de accesibilidad abierto');
    }
  };

  return (
    <div className="accessibility-widget">
      <button 
        className="accessibility-btn" 
        onClick={toggleMenu}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
          <path d="M8 12h8"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="accessibility-panel">
          <h4>Accesibilidad</h4>
          
          <label className="access-option">
            <input 
              type="checkbox" 
              checked={highContrast} 
              onChange={(e) => setHighContrast(e.target.checked)} 
            />
            Alto Contraste
          </label>
          
          <label className="access-option">
            <input 
              type="checkbox" 
              checked={largeText} 
              onChange={(e) => setLargeText(e.target.checked)} 
            />
            Texto Grande
          </label>
          
          <label className="access-option">
            <input 
              type="checkbox" 
              checked={readAloud} 
              onChange={(e) => setReadAloud(e.target.checked)} 
            />
            Lector de Voz
          </label>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;
