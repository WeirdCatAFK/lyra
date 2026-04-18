import { useState, useEffect } from "react";
import "./LoginScreen.css";

import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";

export default function LoginScreen({
  onNavigateToHome,
  onNavigateToRegister,
  onNavigateToFotgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  // teclas presionadas
  const [activeKeys, setActiveKeys] = useState([]);

  // mapa de teclas (piano real)
  const pianoKeys = [
    { note: "C", key: "a", type: "white" },
    { note: "C#", key: "i", type: "black" },
    { note: "D", key: "s", type: "white" },
    { note: "D#", key: "e", type: "black" },
    { note: "E", key: "d", type: "white" },
    { note: "F", key: "f", type: "white" },
    { note: "F#", key: "t", type: "black" },
    { note: "G", key: "g", type: "white" },
    { note: "G#", key: "o", type: "black" },
    { note: "A", key: "m", type: "white" },
    { note: "A#", key: "u", type: "black" },
    { note: "B", key: "j", type: "white" },
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
    <div className="login-container">
      <div className="login-card">

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
        {/* Textos de cabecera */}
        <div className="login-header">
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">¡Continua con el ritmo!</p>
        </div>

        {/* Formulario */}
        <div className="login-form">
          {/* Input: Correo */}
          <div className="login-field">
            <label className="login-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="login-input"
            />
          </div>

          {/* Input: Contraseña */}
          <div className="login-field">
            <label className="login-label">Contraseña</label>

            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="c0ntr4señA"
                className="login-input password-input"
              />

              <img
                src={showPassword ? Ieyeoff : Ieyeon}
                alt="Mostrar/Ocultar contraseña"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          {/* Olvidaste contraseña */}
          <div className="forgot-password-container">
            <button
              type="button"
              className="forgot-password-btn"
              onClick={onNavigateToFotgotPassword}
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>

          {/* Registro */}
          <div className="register-container-text">
            <p className="register-text">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="register-btn"
              >
                Regístrate
              </button>
            </p>
          </div>

          {/* Botón Continuar */}
          <button className="login-button" onClick={onNavigateToHome}>
            Continuar
          </button>

          {/* Login Social */}
          <div className="social-login">
            <p className="social-text">ó continua con:</p>
            <button className="social-button">G</button>
          </div>
        </div>
      </div>
    </div>
  );
}