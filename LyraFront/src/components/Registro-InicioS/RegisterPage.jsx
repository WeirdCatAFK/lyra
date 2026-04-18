import { useState, useEffect } from "react";
import "./RegisterScreen.css";

import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";

export default function RegisterScreen({ onNavigateToHome }) {
  const [showPassword, setShowPassword] = useState(false);

  // teclas que se están presionando
  const [activeKeys, setActiveKeys] = useState([]);

  // mapa de teclado -> teclas del piano
  const pianoKeys = [
  { note: "C", key: "a", type: "white" },
  { note: "C#", key: "e", type: "black" },
  { note: "D", key: "i", type: "white" },
  { note: "D#", key: "o", type: "black" },
  { note: "E", key: "l", type: "white" },
  { note: "F", key: "f", type: "white" },
  { note: "F#", key: "t", type: "black" },
  { note: "G", key: "g", type: "white" },
  { note: "G#", key: "s", type: "black" },
  { note: "A", key: "h", type: "white" },
  { note: "A#", key: "u", type: "black" },
  { note: "B", key: "r", type: "white" },
];

  useEffect(() => {
    const handleKeyDown = (event) => {
      const pressedKey = event.key.toLowerCase();

      if (pianoKeys.some((k) => k.key === pressedKey)) {
        setActiveKeys((prev) =>
          prev.includes(pressedKey) ? prev : [...prev, pressedKey]
        );
      }
    };

    const handleKeyUp = (event) => {
      const releasedKey = event.key.toLowerCase();
      setActiveKeys((prev) => prev.filter((k) => k !== releasedKey));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="register-container">
      <div className="register-card">

        {/*PIANO */}
<div className="mini-piano">
  <div className="white-keys">
    {pianoKeys
      .filter((k) => k.type === "white")
      .map((k) => (
        <div
          key={k.note}
          className={`white-key ${
            activeKeys.includes(k.key) ? "active" : ""
          }`}
        >
          <span className="note">{k.note}</span>
          <span className="keyboard">{k.key.toUpperCase()}</span>
        </div>
      ))}
  </div>

  <div className="black-keys">
    {pianoKeys
      .filter((k) => k.type === "black")
      .map((k) => (
        <div
          key={k.note}
          className={`black-key ${
            activeKeys.includes(k.key) ? "active" : ""
          }`}
          style={{
            left:
              k.note === "C#"
                ? "35px"
                : k.note === "D#"
                ? "85px"
                : k.note === "F#"
                ? "185px"
                : k.note === "G#"
                ? "235px"
                : "285px",
          }}
        >
          <span className="note">{k.note}</span>
          <span className="keyboard">{k.key.toUpperCase()}</span>
        </div>
      ))}
  </div>
  </div>


        <div className="register-header">
          <h1 className="register-title">Regístrate</h1>
          <p className="register-subtitle">Y ¡Siente el ritmo!</p>
        </div>

        <div className="register-form">
          <div className="register-field">
            <label className="register-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="register-input"
            />
          </div>

          <div className="register-field">
            <label className="register-label">Contraseña</label>

            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="c0ntr4señA"
                className="register-input password-input"
              />

              <img
                src={showPassword ? Ieyeoff : Ieyeon}
                alt="Mostrar/Ocultar contraseña"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          <button className="register-button" onClick={onNavigateToHome}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}