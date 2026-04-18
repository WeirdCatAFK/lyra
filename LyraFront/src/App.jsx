import { useState } from "react";
import { ExerciseInterface } from "./components/exercise/ExerciseInterface.jsx";
import { ExerciseResultOverlay } from "./components/exercise/ExerciseResultOverlay.jsx";
import HomePage from "./components/HomePage.jsx";
import { useExerciseSession } from "./hooks/useExerciseSession.js";
import { EXERCISES } from "./lib/exercises.js";
import RegisterScreen from "./components/Registro-InicioS/RegisterPage.jsx";
import LoginScreen from "./components/Registro-InicioS/LoginPage.jsx";
import ForgotPassword from "./components/Registro-InicioS/ForgotPasswordPage.jsx";


export default function App() {
  const [page, setPage] = useState("home");

  const { currentConfig, index, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES);

  if (page == "login") {
    return (
      <LoginScreen
        onNavigateToRegister={() => setPage("register")}
        onNavigateToFotgotPassword={() => setPage("forgot")}
        onNavigateToHome={() => setPage("home")}
      />
    );
  }

  if (page === "register") {
    return <RegisterScreen onNavigateToHome={() => setPage("home")} />;
  }

  if (page === "forgot") {
    return <ForgotPassword onBackToLogin={() => setPage("login")} />;
  }

  if (page === "home") {
    return (
      <HomePage
        onNavigateToLogin={() => setPage("login")}
        onNavigateToRegister={() => setPage("register")}
      />
    );
  }

  return (
    <div className="relative w-full h-screen">
      <ExerciseInterface
        config={currentConfig}
        devExercises={EXERCISES}
        devExerciseIndex={index}
        onDevSelectExercise={jumpTo}
      />
      {isTransitioning && (
        <ExerciseResultOverlay result={lastResult} onNext={advance} />
      )}
    </div>
  );
}
