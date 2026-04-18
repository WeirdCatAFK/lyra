import React from "react";
import logo from "../../assets/logo.png";
import luma from "../../assets/luma.png";
import metronome from "../../assets/metronome.png";
import pentagrama from "../../assets/pentagrama.png";
import "./PracticeScreen.css"; // ¡Asegúrate de importar tu nuevo archivo CSS!

export default function PracticePage() {
  return (
    <div className="practice-page-container">
      {/* --- BARRA DE NAVEGACIÓN (NAVBAR) --- */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo-placeholder">
            <img src={logo} alt="logo" />
          </div>
          <span className="nav-title">Lyra</span>
        </div>

        <div className="nav-links">
          <button className="nav-item">HOME</button>
          <button className="nav-item active">PRÁCTICA</button>
          <button className="profile-btn">
            <span>👤</span>
          </button>
        </div>
      </nav>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="main-content">
        {/* 1. SECCIÓN DEL AGENTE DE IA (Estrella) */}
        <section className="agent-section">
          <div className="agent-image-box">
            <img src={luma} alt="luma" />
          </div>

          <div className="agent-text-container">
            <p className="agent-dialogue">
              El texto representa lo que el agente de IA comenta durante la
              sesión de estudio
            </p>
          </div>
        </section>

        {/* 2. SECCIÓN DE PARTITURA (Fondo Blanco) */}
        <section className="score-section">
          <div className="score-layout">
            {/* Metrónomo */}
            <div className="metronome-box">
              <img src={metronome} alt="Metrónomo" className="absolute-image" />
            </div>

            {/* Contenedor central para Pentagrama y Manos */}
            <div className="center-elements">
              {/* Pentagrama */}
              <div className="pentagram-box">
                <img
                  src={pentagrama}
                  alt="Partitura"
                  className="absolute-image"
                />
              </div>

              {/* Manos (Izquierda y Derecha) */}
              <div className="hands-layout">
                <div className="hand-box">
                  <span className="placeholder-text-dark">
                    Mano
                    <br />
                    Izquierda
                  </span>
                  {/* <img src="/images/left-hand.svg" alt="Mano Izquierda" className="absolute-image" /> */}
                </div>
                <div className="hand-box">
                  <span className="placeholder-text-dark">
                    Mano
                    <br />
                    Derecha
                  </span>
                  {/* <img src="/images/right-hand.svg" alt="Mano Derecha" className="absolute-image" /> */}
                </div>
              </div>
            </div>

            {/* Div para mantener el pentagrama centrado */}
            <div className="balance-spacer"></div>
          </div>
        </section>

        {/* 3. SECCIÓN DEL TECLADO (Vuelve el fondo degradado) */}
        <section className="keyboard-section">
          <div className="glass-panel">
            {/* Teclado Completo */}
            <div className="keyboard-placeholder">
              <span className="keyboard-text">
                Imagen del Teclado Interactivo
              </span>
              {/* <img src="/images/full-keyboard.png" alt="Teclado" className="absolute-image cover-image" /> */}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
