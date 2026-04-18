import { useState, useEffect, useCallback } from "react";
import { ExerciseInterface } from "../exercise/ExerciseInterface.jsx";
import { ExerciseResultOverlay } from "../exercise/ExerciseResultOverlay.jsx";
import AppShell from "../AppShell.jsx";
import { nextExercise, completeSession, clearAuth } from "../../lib/api.js";
import { adaptExercise } from "../../lib/exerciseAdapter.js";
import luma from "../../assets/luma.png";
import "./PracticeScreen.css";

export default function PracticePage({
  userId,
  onLogout,
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
}) {
  const [config,         setConfig]         = useState(null);
  const [sessionId,      setSessionId]      = useState(null);
  const [strategyHint,   setStrategyHint]   = useState(null);
  const [lastResult,     setLastResult]     = useState(null);
  const [isTransitioning, setTransitioning] = useState(false);
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(true);

  const loadNext = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const data = await nextExercise(userId);
      const hint = data.strategy_hint || null;
      setSessionId(data.session_id);
      setStrategyHint(hint);

      const exerciseConfig = adaptExercise(
        data.exercise,
        hint,
        async (metricVector, durationS) => {
          // Called by ExerciseInterface on session complete
          try {
            await completeSession(data.session_id, metricVector, durationS);
          } catch (e) {
            console.warn("completeSession failed:", e.message);
          }
          setLastResult({ metrics: Object.entries(metricVector).map(([label, value]) => ({ label, value })) });
          setTransitioning(true);
        }
      );

      setConfig(exerciseConfig);
    } catch (err) {
      setError(err.message || "Error al cargar ejercicio");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadNext(); }, [loadNext]);

  const handleNext = () => {
    setTransitioning(false);
    setLastResult(null);
    loadNext();
  };

  const handleLogout = () => {
    clearAuth();
    onLogout?.();
  };

  return (
    <AppShell
      currentPage="practice"
      userId={userId}
      onNavigateHome={onNavigateHome}
      onNavigateToPractice={onNavigateToPractice}
      onNavigateToReports={onNavigateToReports}
      onNavigateToExercises={onNavigateToExercises}
      onLogout={handleLogout}
    >
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "2rem" }}>
            <img src={luma} alt="cargando" style={{ width: 80, opacity: 0.85 }} />
            <p style={{ marginLeft: "1rem", color: "#f5f5f5", fontWeight: 500 }}>Preparando ejercicio...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "#ffd1dc", fontWeight: 500 }}>{error}</p>
            <button
              onClick={loadNext}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                background: "#ff5fa2",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && config && (
          <ExerciseInterface config={config} />
        )}

        {isTransitioning && lastResult && (
          <ExerciseResultOverlay result={lastResult} onNext={handleNext} />
        )}
      </div>
    </AppShell>
  );
}
