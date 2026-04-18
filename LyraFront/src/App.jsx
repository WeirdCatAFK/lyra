import { useState, useEffect, useCallback, useRef } from "react";
import { ExerciseInterface } from "./components/exercise/ExerciseInterface.jsx";
import { ExerciseResultOverlay } from "./components/exercise/ExerciseResultOverlay.jsx";
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
import { useExerciseSession } from "./hooks/useExerciseSession.js";
import { EXERCISES } from "./lib/exercises.js";
import { isLoggedIn, getUserId } from "./lib/api.js";

const API_KEY = "AIzaSyA_efjzJGdHCoUkENPpUHrNF5fhla2ftVg";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const WAKE_WORD = "lira";

export default function App() {
  const [page, setPage] = useState(() => (isLoggedIn() ? "practice" : "home"));
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [lastHeardTranscript, setLastHeardTranscript] = useState("");
  const [voiceDraft, setVoiceDraft] = useState("");
  const [voiceSubmitToken, setVoiceSubmitToken] = useState(0);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const silenceTimerRef = useRef(null);
  const {
    isListening,
    transcript,
    liveTranscript,
    status,
    errorMessage,
    startListening,
    stopListening,
  } = useVoiceRecognition();

  const { currentConfig, index, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES);

  const goToPractice = () => setPage("practice");
  const goToHome = () => setPage("home");
  const goToReports = () => setPage("reports");
  const goToExercises = () => setPage("exercises");

  const showAIAssistant = !["login", "register", "forgot"].includes(page);

  useEffect(() => {
    if (showAIAssistant) {
      startListening();
    } else {
      stopListening();
      setVoiceDraft("");
      setIsWakeWordActive(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }
  }, [showAIAssistant, startListening, stopListening]);

  const sendMessageToAssistant = useCallback(async (message) => {
    const cleanedMessage = message.trim();
    if (!cleanedMessage) {
      return "";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Eres un asistente de IA para una aplicación de aprendizaje de piano llamada Lyra. Responde a la siguiente pregunta en el contexto del aprendizaje de piano: "${cleanedMessage}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }, []);

  useEffect(() => {
    if (liveTranscript.trim()) {
      setLastHeardTranscript(liveTranscript);
    }

    if (!showAIAssistant) {
      setIsAIAssistantOpen(false);
      return;
    }

    const normalizedTranscript = transcript.toLowerCase();

    const scheduleSilenceSubmit = (draftText) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (!draftText.trim()) {
        return;
      }

      silenceTimerRef.current = setTimeout(() => {
        setVoiceSubmitToken((token) => token + 1);
        setIsWakeWordActive(false);
      }, 1100);
    };

    if (normalizedTranscript.includes(WAKE_WORD)) {
      setIsAIAssistantOpen(true);
      setIsWakeWordActive(true);

      const wakeWordIndex = normalizedTranscript.lastIndexOf(WAKE_WORD);
      const commandAfterWakeWord = transcript
        .slice(wakeWordIndex + WAKE_WORD.length)
        .trimStart();

      setVoiceDraft(commandAfterWakeWord);
      scheduleSilenceSubmit(commandAfterWakeWord);
      return;
    }

    if (isWakeWordActive) {
      const continuedCommand = transcript.trimStart();
      setVoiceDraft(continuedCommand);
      scheduleSilenceSubmit(continuedCommand);
    }
  }, [transcript, liveTranscript, showAIAssistant, isWakeWordActive]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

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

  if (page === "home") {
    return (
      <>
        <HomePage
          onNavigateToLogin={() => setPage("login")}
          onNavigateToRegister={() => setPage("register")}
          onNavigateToPractice={goToPractice}
          onNavigateToReports={goToReports}
          onNavigateToExercises={goToExercises}
        />
        {showAIAssistant && (
          <AIAssistant
            onClick={startListening}
            isOpen={isAIAssistantOpen}
            onOpenChange={setIsAIAssistantOpen}
            transcript={lastHeardTranscript}
            isListening={isListening}
            status={status}
            errorMessage={errorMessage}
            onSendMessage={sendMessageToAssistant}
            voiceDraft={voiceDraft}
            voiceSubmitToken={voiceSubmitToken}
          />
        )}
      </>
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
      {showAIAssistant && (
        <AIAssistant
          onClick={startListening}
          isOpen={isAIAssistantOpen}
          onOpenChange={setIsAIAssistantOpen}
          transcript={lastHeardTranscript}
          isListening={isListening}
          status={status}
          errorMessage={errorMessage}
          onSendMessage={sendMessageToAssistant}
          voiceDraft={voiceDraft}
          voiceSubmitToken={voiceSubmitToken}
        />
      )}
    </div>
  );
}
