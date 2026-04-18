import { useState, useEffect } from "react";
import HomePage from "./components/HomePage.jsx";
import RegisterScreen from "./components/Registro-InicioS/RegisterPage.jsx";
import LoginScreen from "./components/Registro-InicioS/LoginPage.jsx";
import ForgotPassword from "./components/Registro-InicioS/ForgotPasswordPage.jsx";
import PracticePage from "./components/Registro-InicioS/PracticePage.jsx";
import ReportsPage from "./components/ReportsPage.jsx";
import AiExercisesPage from "./components/AiExercisesPage.jsx";
import AIAssistant from "./components/AIAssistant.jsx";
import useVoiceRecognition from "./hooks/useVoiceRecognition.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AccessibilityMenu from "./components/AccessibilityMenu.jsx";
import { getUserId, clearAuth } from "./lib/api.js";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export default function App() {
  const [page, setPage] = useState("home");
  const {
    isListening,
    transcript,
    interimTranscript,
    status: voiceStatus,
    errorMessage: voiceError,
    startListening,
    resetTranscript,
  } = useVoiceRecognition();

  const goHome      = () => setPage("home");
  const goLogin     = () => setPage("login");
  const goRegister  = () => setPage("register");
  const goPractice  = () => setPage("practice");
  const goReports   = () => setPage("reports");
  const goExercises = () => setPage("exercises");
  const handleLogout = () => { clearAuth(); setPage("home"); };

  // Auto-arrancar sólo si el usuario ya concedió permiso del micrófono en otra
  // visita. En la primera visita esperamos un gesto (clic sobre el asistente) para
  // evitar el doble prompt de StrictMode y cumplir con la política de Chrome.
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'microphone' })
      .then((perm) => {
        if (!cancelled && perm.state === 'granted') startListening();
      })
      .catch(() => { /* Permissions API no disponible — esperar gesto del usuario */ });
    return () => { cancelled = true; };
  }, [startListening]);

  const handleSendMessage = async (message) => {
    if (!genAI) {
      throw new Error("VITE_GEMINI_API_KEY no está configurada");
    }
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Eres un asistente de IA para una aplicación de aprendizaje de piano llamada Lyra. Responde a la siguiente pregunta de manera concisa en el contexto del aprendizaje de piano: "${message}"`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error al contactar a Gemini:", error);
      throw error;
    }
  };

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [voiceSubmitToken, setVoiceSubmitToken] = useState(0);

  useEffect(() => {
    if (transcript) {
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes("lyra") || lowerTranscript.includes("lira")) {
        const parts = lowerTranscript.split(/(?:lyra|lira)/);
        const utterance = parts[1]?.replace(/^[,. ]+/, "").trim(); // Limpiar rastro de comas

        // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to external speech-recognition transcript
        setIsAssistantOpen(true);
        
        if (utterance) {
          setVoiceDraft(utterance);
          setVoiceSubmitToken(Date.now());
          resetTranscript();
        }
      }
    }
  }, [transcript, resetTranscript]);

  const showAIAssistant = !["login", "register", "forgot"].includes(page);

  const assistant = showAIAssistant ? (
    <AIAssistant
      onClick={startListening}
      onSendMessage={handleSendMessage}
      isOpen={isAssistantOpen}
      onOpenChange={setIsAssistantOpen}
      transcript={transcript}
      interimTranscript={interimTranscript}
      isListening={isListening}
      status={voiceStatus}
      errorMessage={voiceError}
      voiceDraft={voiceDraft}
      voiceSubmitToken={voiceSubmitToken}
    />
  ) : null;

  const navProps = {
    onLogout: handleLogout,
    onNavigateHome: goHome,
    onNavigateToPractice: goPractice,
    onNavigateToReports: goReports,
    onNavigateToExercises: goExercises,
  };

  if (page === "login") {
    return (
      <LoginScreen
        onNavigateToRegister={goRegister}
        onNavigateToFotgotPassword={() => setPage("forgot")}
        onNavigateToHome={goHome}
        onLoginSuccess={goPractice}
      />
    );
  }

  if (page === "register") {
    return (
      <RegisterScreen
        onNavigateToHome={goHome}
        onRegisterSuccess={goPractice}
      />
    );
  }

  if (page === "forgot") {
    return <ForgotPassword onBackToLogin={goLogin} />;
  }

  if (page === "practice") {
    return (
      <>
        <PracticePage userId={getUserId()} {...navProps} />
        <AccessibilityMenu />
        {assistant}
      </>
    );
  }

  if (page === "reports") {
    return (
      <>
        <ReportsPage userId={getUserId()} {...navProps} />
        <AccessibilityMenu />
        {assistant}
      </>
    );
  }

  if (page === "exercises") {
    return (
      <>
        <AiExercisesPage userId={getUserId()} {...navProps} />
        <AccessibilityMenu />
        {assistant}
      </>
    );
  }

  return (
    <>
      <HomePage
        onNavigateToLogin={goLogin}
        onNavigateToRegister={goRegister}
        onNavigateToPractice={goPractice}
        onNavigateToReports={goReports}
        onNavigateToExercises={goExercises}
      />
      <AccessibilityMenu />
      {assistant}
    </>
  );
}
