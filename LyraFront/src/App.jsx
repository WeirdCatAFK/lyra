import { useState } from "react";
import HomePage from "./components/HomePage.jsx";
import RegisterScreen from "./components/Registro-InicioS/RegisterPage.jsx";
import LoginScreen from "./components/Registro-InicioS/LoginPage.jsx";
import ForgotPassword from "./components/Registro-InicioS/ForgotPasswordPage.jsx";
import PracticePage from "./components/Registro-InicioS/PracticePage.jsx";
import ReportsPage from "./components/ReportsPage.jsx";
import AiExercisesPage from "./components/AiExercisesPage.jsx";
import { isLoggedIn, getUserId } from "./lib/api.js";

export default function App() {
  const [page, setPage] = useState(() => isLoggedIn() ? "practice" : "home");

  const goToPractice  = () => setPage("practice");
  const goToHome      = () => setPage("home");
  const goToReports   = () => setPage("reports");
  const goToExercises = () => setPage("exercises");

  if (page === "login") {
    return (
      <LoginScreen
        onNavigateToRegister={() => setPage("register")}
        onNavigateToFotgotPassword={() => setPage("forgot")}
        onNavigateToHome={goToHome}
        onLoginSuccess={goToPractice}
      />
    );
  }

  if (page === "register") {
    return (
      <RegisterScreen
        onNavigateToHome={goToHome}
        onRegisterSuccess={goToPractice}
      />
    );
  }

  if (page === "forgot") {
    return <ForgotPassword onBackToLogin={() => setPage("login")} />;
  }

  if (page === "practice") {
    return (
      <PracticePage
        userId={getUserId()}
        onLogout={goToHome}
        onNavigateHome={goToHome}
        onNavigateToPractice={goToPractice}
        onNavigateToReports={goToReports}
        onNavigateToExercises={goToExercises}
      />
    );
  }

  if (page === "reports") {
    return (
      <ReportsPage
        userId={getUserId()}
        onLogout={goToHome}
        onNavigateHome={goToHome}
        onNavigateToPractice={goToPractice}
        onNavigateToReports={goToReports}
        onNavigateToExercises={goToExercises}
      />
    );
  }

  if (page === "exercises") {
    return (
      <AiExercisesPage
        userId={getUserId()}
        onLogout={goToHome}
        onNavigateHome={goToHome}
        onNavigateToPractice={goToPractice}
        onNavigateToReports={goToReports}
        onNavigateToExercises={goToExercises}
      />
    );
  }

  return (
    <HomePage
      onNavigateToLogin={() => setPage("login")}
      onNavigateToRegister={() => setPage("register")}
      onNavigateToPractice={goToPractice}
      onNavigateToReports={goToReports}
      onNavigateToExercises={goToExercises}
    />
  );
}
