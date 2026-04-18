import { useState, useEffect } from "react";
import "./ForgotPassword.css";

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // teclas presionadas
  const [activeKeys, setActiveKeys] = useState([]);

  // mapa de teclas piano
  const pianoKeys = [
    { note: "C", key: "a", type: "white" },
    { note: "C#", key: "l", type: "black" },
    { note: "D", key: "s", type: "white" },
    { note: "D#", key: "e", type: "black" },
    { note: "E", key: "i", type: "white" },
    { note: "F", key: "f", type: "white" },
    { note: "F#", key: "t", type: "black" },
    { note: "G", key: "g", type: "white" },
    { note: "G#", key: "o", type: "black" },
    { note: "A", key: "h", type: "white" },
    { note: "A#", key: "u", type: "black" },
    { note: "B", key: "c", type: "white" },
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

  const handleResetPassword = () => {
    if (email.trim() === "") {
      alert("Por favor, ingresa tu correo electrónico.");
      return;
    }

    console.log("Enviando correo de recuperación a:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="page-container">
      <div className="card">

        {/* PIANO */}
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

        {isSubmitted ? (
          <div className="success-container">
            <div className="icon-wrapper">
              <div className="success-icon"> ✔</div>
            </div>

            <h2 className="title">¡Correo enviado!</h2>

            <p className="description">
              Hemos enviado las instrucciones a <br />
              <span className="email-highlight">{email}</span>
            </p>

            <button onClick={onBackToLogin} className="primary-button">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <p className="subtitle">No te preocupes, no todo está perdido (:</p>

            <h1 className="main-title">Restablece tu contraseña</h1>

            <p className="description">
              Te enviaremos un correo para el cambio
            </p>

            <div className="form-group">
              <label className="label">Correo electrónico</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-field"
              />

              <button onClick={handleResetPassword} className="primary-button">
                Enviar
              </button>
            </div>

            <div className="back-link-wrapper">
              <button onClick={onBackToLogin} className="back-link">
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}