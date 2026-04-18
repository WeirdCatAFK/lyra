import "./HomeScreen.css";

const NAV_ITEMS = [
  { key: "practice",  label: "PRÁCTICA",     handlerKey: "onNavigateToPractice" },
  { key: "reports",   label: "REPORTES",     handlerKey: "onNavigateToReports" },
  { key: "exercises", label: "EJERCICIOS", handlerKey: "onNavigateToExercises" },
];

/**
 * Logged-in top header — same shell as HomePage's logged-in header
 * (same `home-header` / `header-left` / `header-center` / `header-right` classes).
 */
export default function AppSidebar({
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
  onLogout,
}) {
  const handlers = {
    onNavigateToPractice,
    onNavigateToReports,
    onNavigateToExercises,
  };

  return (
    <header className="home-header">
      <div className="header-left">
        <span className="logo-icon">✦</span>
        <span className="logo-text">Lyra</span>
      </div>

      <nav className="header-center">
        <button
          type="button"
          className="nav-link nav-link--btn"
          onClick={onNavigateHome}
        >
          INICIO
        </button>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className="nav-link nav-link--btn"
            onClick={handlers[item.handlerKey]}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <button
          type="button"
          className="btn-outline"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
