import { useState } from "react";
import { ExerciseInterface } from "./components/exercise/ExerciseInterface.jsx";
import { ExerciseResultOverlay } from "./components/exercise/ExerciseResultOverlay.jsx";
import HomePage from "./components/HomePage.jsx";
import { useExerciseSession } from "./hooks/useExerciseSession.js";
import { EXERCISES } from "./lib/exercises.js";
import RegisterScreen from "./components/RegisterPage.jsx";
import LoginScreen from "./components/LoginPage.jsx";

export default function App() {
  const [page, setPage] = useState("login");

  const { currentConfig, index, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES);

  if (page == "login") {
    return (
      <LoginScreen
        onNavigateToRegister={() => setPage("register")}
        onNavigateToHome={() => setPage("home")}
      />
    );
  }

  if (page === "register") {
    return <RegisterScreen onNavigateToHome={() => setPage("home")} />;
  }

  if (page === "home") {
    return <HomePage onStart={() => setPage("exercise")} />;
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
