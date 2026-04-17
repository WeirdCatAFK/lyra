import { useState } from "react";

export default function LoginScreen({
  onNavigateToHome,
  onNavigateToRegister,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    // Fondo degradado usando tu paleta de colores
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#FF85BB] to-[#021A54] font-sans">
      {/* Tarjeta con efecto Glassmorphism (Cristal) */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-8 shadow-2xl">
        {/* Ícono superior */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#F5F5F5] w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            🎹
          </div>
        </div>

        {/* Textos de cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Bienvenido</h1>
          <p className="text-[#F5F5F5] font-semibold opacity-90">
            ¡Continua con el ritmo!
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-5">
          {/* Input: Correo */}
          <div>
            <label className="block text-[#F5F5F5] text-sm font-bold mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full bg-white/10 border border-white/20 text-[#F5F5F5] placeholder-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF85BB] transition-all"
            />
          </div>

          {/* Input: Contraseña */}
          <div>
            <label className="block text-[#F5F5F5] text-sm font-bold mb-2">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="c0ntr4señA"
                className="w-full bg-white/10 border border-white/20 text-[#F5F5F5] placeholder-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF85BB] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gray-300 hover:text-white transition-colors"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div className="mt-3 text-left">
            <button
              type="button"
              className="text-[#F5F5F5] text-sm underline opacity-80 hover:opacity-100 hover:text-[#FF85BB] transition-all"
              onClick={() => console.log("Navegar a recuperar contraseña")}
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#F5F5F5] text-sm">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-[#FF85BB] font-bold hover:underline transition-all"
              >
                Regístrate
              </button>
            </p>
          </div>

          {/* Botón Continuar */}
          <button
            onClick={onNavigateToHome}
            className="w-full bg-[#021A54] text-[#F5F5F5] font-bold text-lg rounded-xl py-4 mt-4 hover:bg-opacity-90 shadow-lg transform hover:scale-[1.02] transition-all"
          >
            Continuar
          </button>

          {/* Login Social */}
          <div className="text-center mt-8">
            <p className="text-[#F5F5F5] text-sm mb-4">ó continua con:</p>
            <button className="bg-white/10 border border-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto hover:bg-white/20 transition-colors text-[#F5F5F5] font-bold text-xl">
              G
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
