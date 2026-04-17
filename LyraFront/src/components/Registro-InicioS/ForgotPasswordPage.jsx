import { useState } from "react";
import "./ForgotPassword.css"; // Importamos el nuevo archivo CSS

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        {isSubmitted ? (
          <div className="success-container">
            <div className="icon-wrapper">
              <div className="success-icon">✅</div>
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
            <div className="icon-wrapper">
              <div className="piano-icon">🎹</div>
            </div>

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
