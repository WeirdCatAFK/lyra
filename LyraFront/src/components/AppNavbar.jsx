import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import "./Registro-InicioS/PracticeScreen.css";

/**
 * Logged-in app navbar shared across Practice / Reports / AI Exercises.
 * `currentPage` highlights the active link.
 */
export default function AppNavbar({
  currentPage,
  userId,
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
  onLogout,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const cls = (page) => (currentPage === page ? "nav-item active" : "nav-item");

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-placeholder">
          <img src={logo} alt="logo" />
        </div>
        <span className="nav-title">Lyra</span>
      </div>
      <div className="nav-links">
        <button className="nav-item" onClick={onNavigateHome}>HOME</button>
        <button className={cls("practice")} onClick={onNavigateToPractice}>PRÁCTICA</button>
        <button className={cls("reports")} onClick={onNavigateToReports}>REPORTES</button>
        <button className={cls("exercises")} onClick={onNavigateToExercises}>EJERCICIOS</button>

        <div
          className="profile-menu-wrapper"
          ref={profileRef}
          style={{ position: "relative" }}
        >
          <button
            className="profile-btn"
            aria-label="Cuenta"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>
              {(userId || "?").toString().slice(0, 1).toUpperCase()}
            </span>
          </button>
          {profileOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#021a54", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.75rem", padding: "0.5rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                minWidth: "160px", zIndex: 50,
              }}
            >
              <button
                onClick={onLogout}
                style={{
                  width: "100%", textAlign: "left",
                  background: "transparent", border: "none",
                  color: "#fff", padding: "0.5rem 0.75rem",
                  cursor: "pointer", borderRadius: "0.5rem",
                  fontFamily: "inherit", fontSize: "0.9rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
