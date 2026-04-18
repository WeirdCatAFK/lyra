import { useState } from "react";
import "./HomeScreen.css";
import starImg from "../assets/luma.png"; 
import pianoImg from "../assets/piano1.jpg";
import controlImg from "../assets/control.jpg";
import aiImg from "../assets/ia.jpg";

export default function HomeScreen({onNavigateToLogin,onNavigateToRegister}) {
  return (
    <div className="home-container">
      
      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Lyra</span>
        </div>

        <nav className="header-center">
          <a href="/" className="nav-link">HOME</a>
        </nav>

        <div className="header-right">
          <button 
          type="button"
          className="btn-outline"
          onClick={onNavigateToLogin}
          >Login</button>

          <button 
          type="button"
          className="btn-pink"
          onClick={onNavigateToRegister}
          >Sign Up</button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">

          <div className="hero-text">
            <h1>¡Hola!</h1>
            <p>
              Aquí el piano no tiene límites, no tiene barreras y sí tiene mucha música.
              <br /><br />
              Esta es una plataforma de aprendizaje inclusiva, diseñada para que cualquier persona pueda aprender a tocar piano,
              sin importar su forma de aprender o percibir el mundo.
            </p>

            <button className="hero-btn">¡A practicar!</button>
          </div>

          <div className="hero-image">
            <img src={starImg} alt="Mascota" />
          </div>

        </div>

        {/* WAVE DIVIDER */}
        <div className="wave-divider">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="#ffffff"
              d="M0,200 
              C180,80 360,320 540,200 
              C720,80 900,320 1080,200 
              C1260,80 1350,160 1440,140 
              L1440,320 L0,320 Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* CARDS */}
      <section className="cards-section">
        <div className="cards-grid">

          <div className="card">
            <img src={pianoImg} alt="Piano" className="card-img" />
            <h3>Lecciones paso a paso</h3>
            <p>
              Dedica de 5-10 minutos en lecciones hechas para ti, adéntrate a estas lecciones en tu horario y mantén un momento.
            </p>
          </div>

          <div className="card">
            <img src={controlImg} alt="Juego" className="card-img" />
            <h3>Juego y aprendizaje</h3>
            <p>
              Con niveles, mejora tu habilidad y escala de principiante a niveles avanzados personalizados conforme avanzas.
            </p>
          </div>

          <div className="card">
            <img src={aiImg} alt="IA" className="card-img" />
            <h3>IA adaptativa</h3>
            <p>
              Tips corregidos en tiempo real, niveles conforme avanzas y aprendizaje personalizado basado en tu rendimiento.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}