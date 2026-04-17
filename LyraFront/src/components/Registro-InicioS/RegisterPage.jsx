import { useState } from "react";
import "./RegisterScreen.css";

import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";

export default function RegisterScreen({ onNavigateToHome }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-icon-container">
          <div className="register-icon">🎹</div>
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