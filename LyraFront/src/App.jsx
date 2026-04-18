import { useState, useEffect } from "react";
import { ExerciseInterface } from "./components/exercise/ExerciseInterface.jsx";
import { ExerciseResultOverlay } from "./components/exercise/ExerciseResultOverlay.jsx";
import HomePage from "./components/HomePage.jsx";
import { useExerciseSession } from "./hooks/useExerciseSession.js";
import { EXERCISES } from "./lib/exercises.js";
import RegisterScreen from "./components/Registro-InicioS/RegisterPage.jsx";
import LoginScreen from "./components/Registro-InicioS/LoginPage.jsx";
import ForgotPassword from "./components/Registro-InicioS/ForgotPasswordPage.jsx";
import AIAssistant from "./components/AIAssistant.jsx";
import useVoiceRecognition from "./hooks/useVoiceRecognition.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AccessibilityMenu from "./components/AccessibilityMenu.jsx";

const API_KEY = "AIzaSyBGzV2C1DC5FHCM586uH8pecHz2Ae0UtIM";
const genAI = new GoogleGenerativeAI(API_KEY);

export default function App() {
  const [page, setPage] = useState("home");
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();
  const [aiResponse, setAiResponse] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);

  const { currentConfig, index, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES);

  // Iniciar la escucha del micrófono en cuanto arranca la app para detectar la palabra de paso
  useEffect(() => {
    startListening();
  }, [startListening]);

  const handleSendMessage = async (message) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Eres un asistente de IA para una aplicación de aprendizaje de piano llamada Lyra. Responde a la siguiente pregunta de manera concisa en el contexto del aprendizaje de piano: "${message}"`;
      const result = await model.generateContent(prompt);
      const output = result.response.text();
      setAiResponse(output);
      return output;
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
      <>
        <HomePage
          onNavigateToLogin={() => setPage("login")}
          onNavigateToRegister={() => setPage("register")}
        />
        <AccessibilityMenu />
        {showAIAssistant && (
          <AIAssistant
            onClick={startListening}
            onSendMessage={handleSendMessage}
            isOpen={isAssistantOpen}
            onOpenChange={setIsAssistantOpen}
            transcript={transcript}
            isListening={isListening}
            voiceDraft={voiceDraft}
            voiceSubmitToken={voiceSubmitToken}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <AccessibilityMenu />
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
          onSendMessage={handleSendMessage}
          isOpen={isAssistantOpen}
          onOpenChange={setIsAssistantOpen}
          transcript={transcript}
          isListening={isListening}
          voiceDraft={voiceDraft}
          voiceSubmitToken={voiceSubmitToken}
        />
      )}
    </div>
  );
}
