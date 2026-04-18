import AppSidebar from "./AppSidebar.jsx";
import "./AppShell.css";

/**
 * Layout wrapper for logged-in app pages.
 * Renders a left sidebar + main content area.
 */
export default function AppShell({
  currentPage,
  userId,
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
  onLogout,
  children,
}) {
  return (
    <div className="app-shell">
      <AppSidebar
        currentPage={currentPage}
        userId={userId}
        onNavigateHome={onNavigateHome}
        onNavigateToPractice={onNavigateToPractice}
        onNavigateToReports={onNavigateToReports}
        onNavigateToExercises={onNavigateToExercises}
        onLogout={onLogout}
      />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
