import { useState, useEffect } from "react";
import "./RegisterScreen.css";
import Ieyeon from "../../assets/ojoson.png";
import Ieyeoff from "../../assets/ojosoff.png";
import { register } from "../../lib/api.js";

const pianoKeys = [
  { note: "C",  key: "a", type: "white" },
  { note: "C#", key: "e", type: "black" },
  { note: "D",  key: "i", type: "white" },
  { note: "D#", key: "o", type: "black" },
  { note: "E",  key: "l", type: "white" },
  { note: "F",  key: "f", type: "white" },
  { note: "F#", key: "t", type: "black" },
  { note: "G",  key: "g", type: "white" },
  { note: "G#", key: "s", type: "black" },
  { note: "A",  key: "h", type: "white" },
  { note: "A#", key: "u", type: "black" },
  { note: "B",  key: "r", type: "white" },
];

const OBJECTIVE_OPTIONS = [
  "Aprender desde cero",
  "Mejorar técnica",
  "Preparar examen grado 3",
  "Improvisar jazz",
  "Tocar canciones populares",
  "Leer partituras",
];

export default function RegisterScreen({ onNavigateToHome, onRegisterSuccess }) {
  const [showPassword,  setShowPassword]  = useState(false);
  const [activeKeys,    setActiveKeys]    = useState([]);
  const [username,      setUsername]      = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [objectives,    setObjectives]    = useState([]);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    const down = (e) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (pianoKeys.some(p => p.key === k)) setActiveKeys(prev => prev.includes(k) ? prev : [...prev, k]);
    };
    const up = (e) => {
      if (!e.key) return;
      setActiveKeys(prev => prev.filter(p => p !== e.key.toLowerCase()));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const toggleObjective = (obj) =>
    setObjectives(prev => prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true);
    setError("");
    try {
      await register(username, email, password, objectives);
      onRegisterSuccess?.();
    } catch (err) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">

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

        <div className="register-header">
          <h1 className="register-title">Regístrate</h1>
          <p className="register-subtitle">¡Y siente el ritmo!</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label className="register-label">Nombre de usuario</label>
            <input
              type="text"
              placeholder="tu_nombre"
              className="register-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="register-field">
            <label className="register-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="register-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="register-field">
            <label className="register-label">Contraseña</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="c0ntr4señA"
                className="register-input password-input"
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

          <div className="register-field">
            <label className="register-label">¿Qué quieres aprender? (opcional)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
              {OBJECTIVE_OPTIONS.map(obj => (
                <button
                  key={obj}
                  type="button"
                  onClick={() => toggleObjective(obj)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid #ccc",
                    background: objectives.includes(obj) ? "#ff5fa2" : "rgba(255,255,255,0.85)",
                    color: objectives.includes(obj) ? "#fff" : "#333",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}

          <button className="register-button" type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
