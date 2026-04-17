import { useState } from "react";
import "./LoginScreen.css";

import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";

export default function LoginScreen({
  onNavigateToHome,
  onNavigateToRegister,
  onNavigateToFotgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Ícono superior */}
        <div className="login-icon-container">
          <div className="login-icon">🎹</div>
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
