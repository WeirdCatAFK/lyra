import { useState, useEffect } from "react";
import "./LoginScreen.css";
import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";
import { login } from "../../lib/api.js";

const pianoKeys = [
  { note: "C",  key: "a", type: "white" },
  { note: "C#", key: "i", type: "black" },
  { note: "D",  key: "s", type: "white" },
  { note: "D#", key: "e", type: "black" },
  { note: "E",  key: "d", type: "white" },
  { note: "F",  key: "f", type: "white" },
  { note: "F#", key: "t", type: "black" },
  { note: "G",  key: "g", type: "white" },
  { note: "G#", key: "o", type: "black" },
  { note: "A",  key: "m", type: "white" },
  { note: "A#", key: "u", type: "black" },
  { note: "B",  key: "j", type: "white" },
];

export default function LoginScreen({
  onNavigateToHome,
  onNavigateToRegister,
  onNavigateToFotgotPassword,
  onLoginSuccess,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeKeys,   setActiveKeys]   = useState([]);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    const down = (e) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (pianoKeys.some(p => p.key === k)) setActiveKeys(prev => prev.includes(k) ? prev : [...prev, k]);
    };
    const up = (e) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      setActiveKeys(prev => prev.filter(p => p !== k));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      onLoginSuccess?.();
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* PIANO */}
        <div className="mini-piano">
          <div className="white-keys">
            {pianoKeys.filter(k => k.type === "white").map(k => (
              <div key={k.note} className={`white-key ${activeKeys.includes(k.key) ? "active" : ""}`}>
                <span className="note">{k.note}</span>
                <span className="keyboard">{k.key.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div className="black-keys">
            {pianoKeys.filter(k => k.type === "black").map(k => (
              <div
                key={k.note}
                className={`black-key ${activeKeys.includes(k.key) ? "active" : ""}`}
                style={{ left: k.note==="C#"?"35px":k.note==="D#"?"85px":k.note==="F#"?"185px":k.note==="G#"?"235px":"285px" }}
              >
                <span className="note">{k.note}</span>
                <span className="keyboard">{k.key.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-header">
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">¡Continua con el ritmo!</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="login-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="c0ntr4señA"
                className="login-input password-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <img
                src={showPassword ? Ieyeoff : Ieyeon}
                alt="Mostrar/Ocultar contraseña"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}

          <div className="register-container-text">
            <p className="register-text">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={onNavigateToRegister} className="register-btn">
                Regístrate
              </button>
            </p>
          </div>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Continuar"}
          </button>

          <div className="social-login">
            <p className="social-text">ó continua con:</p>
            <button
              type="button"
              className="social-button"
              disabled
              title="Próximamente"
              style={{ opacity: 0.4, cursor: "not-allowed" }}
            >
              G
            </button>
            <p className="social-text" style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "6px" }}>
              Próximamente
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
