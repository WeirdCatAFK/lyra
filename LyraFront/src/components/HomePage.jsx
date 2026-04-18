import "./HomeScreen.css";
import starImg from "../assets/luma.png";
import pianoImg from "../assets/piano1.jpg";
import controlImg from "../assets/control.jpg";
import aiImg from "../assets/ia.jpg";
import { isLoggedIn, clearAuth } from "../lib/api.js";

const WAVE_PATHS = {
  // Bold double-crest — used for the hero spill into white.
  bold: "M0,180 C120,30 280,310 420,160 C560,20 700,300 840,160 C980,30 1120,310 1260,170 C1340,80 1400,220 1440,150 L1440,320 L0,320 Z",
  // Long swell — wider arcs but now reaching higher and dipping deeper.
  swell:
    "M0,200 C180,40 360,300 540,150 C720,20 900,300 1080,140 C1260,40 1360,280 1440,180 L1440,320 L0,320 Z",
  // Tighter chop — adds rhythm so the stack doesn't feel mechanical.
  chop: "M0,210 C100,30 220,310 360,160 C500,20 640,300 780,150 C920,20 1060,300 1200,160 C1320,50 1400,270 1440,180 L1440,320 L0,320 Z",
  // Asymmetric crests — leans right, breaks the repetition.
  lean: "M0,170 C200,30 380,300 560,150 C740,20 920,290 1100,160 C1260,80 1380,250 1440,180 L1440,320 L0,320 Z",
};

function SectionWave({ fill, variant = "swell", height = "120px" }) {
  return (
    <div className="section-wave" style={{ height }}>
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path d={WAVE_PATHS[variant]} fill={fill} />
      </svg>
    </div>
  );
}

export default function HomeScreen({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
}) {
  const loggedIn = isLoggedIn();

  const handleHeroCta = () => {
    if (loggedIn) onNavigateToPractice?.();
    else onNavigateToLogin?.();
  };

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div className="home-container" id="top">
      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Lyra</span>
        </div>

        <nav className="header-center">
          <a href="#top" className="nav-link">
            INICIO
          </a>
          {loggedIn ? (
            <>
              <button
                type="button"
                className="nav-link nav-link--btn"
                onClick={onNavigateToPractice}
              >
                PRÁCTICA
              </button>
              <button
                type="button"
                className="nav-link nav-link--btn"
                onClick={onNavigateToReports}
              >
                REPORTES
              </button>
              <button
                type="button"
                className="nav-link nav-link--btn"
                onClick={onNavigateToExercises}
              >
                EJERCICIOS
              </button>
            </>
          ) : (
            <>
              <a href="#what-is-lyra" className="nav-link">
                SOBRE LYRA
              </a>
              <a href="#approach" className="nav-link">
                CÓMO FUNCIONA
              </a>
              <a href="#mission" className="nav-link">
                MISIÓN
              </a>
            </>
          )}
        </nav>

        <div className="header-right">
          {loggedIn ? (
            <button
              type="button"
              className="btn-outline"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline"
                onClick={onNavigateToLogin}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className="btn-pink"
                onClick={onNavigateToRegister}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>¡Hola!</h1>
            <p>
              Aquí el piano no tiene límites, no tiene barreras y sí tiene mucha
              música.
              <br />
              <br />
              Esta es una plataforma de aprendizaje inclusiva, diseñada para que
              cualquier persona pueda aprender a tocar piano, sin importar su
              forma de aprender o percibir el mundo.
            </p>

            <button type="button" className="hero-btn" onClick={handleHeroCta}>
              {loggedIn ? "Continuar practicando" : "¡A practicar!"}
            </button>
          </div>

          <div className="hero-image">
            <img src={starImg} alt="Mascota" />
          </div>
        </div>

        {/* hero → cards (white) */}
        <SectionWave fill="#ffffff" variant="bold" height="160px" />
      </section>

      {/* CARDS */}
      <section className="cards-section">
        <div className="cards-grid">
          <div className="card">
            <img src={pianoImg} alt="Piano" className="card-img" />
            <h3>Lecciones paso a paso</h3>
            <p>
              Dedica de 5-10 minutos en lecciones hechas para ti, adéntrate a
              estas lecciones en tu horario y mantén un momento.
            </p>
          </div>

          <div className="card">
            <img src={controlImg} alt="Juego" className="card-img" />
            <h3>Juego y aprendizaje</h3>
            <p>
              Con niveles, mejora tu habilidad y escala de principiante a
              niveles avanzados personalizados conforme avanzas.
            </p>
          </div>

          <div className="card">
            <img src={aiImg} alt="IA" className="card-img" />
            <h3>IA adaptativa</h3>
            <p>
              Tips corregidos en tiempo real, niveles conforme avanzas y
              aprendizaje personalizado basado en tu rendimiento.
            </p>
          </div>
        </div>

        {/* cards → what-is-lyra (dark navy) */}
        <SectionWave fill="#021a54" variant="swell" />
      </section>

      {/* WHAT IS LYRA */}
      <section id="what-is-lyra" className="info-section info-section--dark">
        <div className="info-inner">
          <h2 className="info-title">¿Qué es Lyra?</h2>
          <p className="info-lead">
            Lyra es una plataforma de aprendizaje de piano que escucha cómo
            tocas, mide tu progreso nota a nota y adapta cada lección para ti.
            No reemplaza a un maestro: complementa tu práctica cuando no hay
            nadie disponible para guiarte.
          </p>
          <div className="info-bullets">
            <div className="info-bullet">
              <div className="info-bullet-icon"></div>
              <h4>Accesible</h4>
              <p>
                Diseñada pensando en personas neurodivergentes, principiantes
                absolutos y autodidactas.
              </p>
            </div>
            <div className="info-bullet">
              <div className="info-bullet-icon"></div>
              <h4>Adaptativo</h4>
              <p>
                El nivel de ayuda visual cambia conforme te vuelves
                independiente del andamiaje.
              </p>
            </div>
            <div className="info-bullet">
              <div className="info-bullet-icon"></div>
              <h4>Libre de usar</h4>
              <p>
                Código abierto. Sin suscripciones, sin barreras económicas para
                empezar.
              </p>
            </div>
          </div>
        </div>

        {/* what-is-lyra → approach (lavender) */}
        <SectionWave fill="#f7f4fb" variant="chop" />
      </section>

      {/* APPROACH */}
      <section id="approach" className="info-section info-section--light">
        <div className="info-inner">
          <h2 className="info-title">Cómo aprende contigo</h2>
          <p className="info-lead">
            Lyra no se limita a mostrar partituras: te escucha tocar, mide cómo
            evolucionas y construye un plan que cambia con cada sesión. Aquí
            está el ciclo completo.
          </p>
          <div className="approach-steps">
            <div className="approach-step">
              <div className="approach-step-num">1</div>
              <h4>Te escucha</h4>
              <p>
                Tu teclado MIDI envía cada nota a Lyra en tiempo real. No solo
                registra qué tecla presionaste: mide precisión melódica,
                estabilidad rítmica, dinámica del toque, los silencios entre
                notas y cuántas veces te corriges sobre la marcha. De ahí nace
                un vector de ocho dimensiones que retrata cómo tocas{" "}
                <em>hoy</em>.
              </p>
            </div>
            <div className="approach-step">
              <div className="approach-step-num">2</div>
              <h4>Se adapta</h4>
              <p>
                Un motor determinístico decide qué andamiaje mostrarte: notas
                que caen en pantalla, teclas resaltadas, indicadores de
                digitación. Conforme tu independencia crece, ese apoyo se
                desvanece poco a poco — y vuelve si tropiezas. El objetivo no es
                que dependas de Lyra, sino que aprendas a leer y tocar por tu
                cuenta.
              </p>
            </div>
            <div className="approach-step">
              <div className="approach-step-num">3</div>
              <h4>Aprende de ti</h4>
              <p>
                Tras cada sesión, una red neuronal convolucional analiza tu
                progreso reciente y elige el siguiente ejercicio buscando el
                mayor salto en habilidad. La mezcla con el motor determinístico
                es ε-greedy: explora cuando estás estancado, explota lo que
                funciona cuando avanzas con fluidez.
              </p>
            </div>
          </div>

          <div className="approach-bonus">
            <span className="approach-bonus-eyebrow">Capa LLM</span>
            <h4>Ejercicios compuestos a tu medida</h4>
            <p>
              Con la capa LLM activada, un modelo de lenguaje toma tu vector de
              habilidades y<em> compone ejercicios nuevos </em> apuntados a tus
              puntos débiles concretos. ¿Te cuesta el cambio de pulgar en una
              escala ascendente? ¿La mano izquierda se atrasa en compases
              compuestos? ¿Pierdes precisión al subir el tempo? Lyra escribe una
              pieza corta para practicar exactamente eso, con la dificultad
              calibrada a tu nivel actual y notación generada al vuelo.
            </p>
            <p>
              Si decides no activarla, Lyra sigue funcionando igual con su
              catálogo curado y la CNN — la capa LLM solo amplía el repertorio
              cuando el catálogo se queda corto para lo que necesitas practicar.
            </p>
          </div>
        </div>

        {/* approach → model (dark navy) */}
        <SectionWave fill="#021a54" variant="lean" />
      </section>

      {/* PROBLEM / STORY */}
      <section id="problem" className="info-section info-section--dark">
        <div className="info-inner">
          <h2 className="info-title">El problema que estamos resolviendo</h2>
          <p className="info-lead">
            Aprender música no es imposible. Pero para mucha gente, sigue siendo
            innecesariamente difícil.
          </p>

          <div className="model-grid">
            <div className="model-col">
              <h4>Lo que pasa hoy</h4>
              <p>
                Tomar clases particulares no es accesible para todos. Muchas
                apps son caras, están en inglés, o asumen una forma muy
                específica de aprender. YouTube ayuda, pero casi siempre te
                enseña a repetir canciones, no a entender lo que estás tocando.
                Si no tienes acceso a un maestro, si empiezas tarde, o si no
                encajas en ese “promedio” para el que están diseñadas estas
                herramientas, avanzar se vuelve frustrante. No porque no puedas
                aprender, sino porque el camino no está hecho para ti.
              </p>
            </div>

            <div className="model-col">
              <h4>Lo que cambia con Lyra</h4>
              <p>
                Lyra intenta hacer eso más simple. En lugar de seguir un camino
                fijo, se adapta a cómo tocas y a tu ritmo. No se enfoca solo en
                si acertaste la nota, sino en cómo estás entendiendo el
                instrumento. Está pensada para funcionar en español, sin
                suscripción, y sin asumir que todos aprenden igual. La idea es
                que puedas empezar desde donde estás, con lo que tienes, y
                avanzar sin sentir que estás fuera de lugar.
              </p>
            </div>
          </div>

        </div>

        {/* problem → mission (gradient start) */}
        <SectionWave fill="#1a1052" variant="swell" />
      </section>
      {/* MISSION */}
      <section id="mission" className="info-section mission-section">
        <div className="info-inner">
          <div className="mission-card">
            <h2 className="mission-title">Nuestra misión cultural</h2>
            <p className="mission-quote">
              "Lyra nace del esfuerzo cultural por democratizar la música.
              Creemos que aprender piano no debe depender de tener un maestro
              disponible, recursos económicos, ni una forma neurotípica de
              procesar el mundo. Cada persona escucha la música a su manera — y
              cada persona merece una herramienta que escuche de vuelta."
            </p>
            <p className="mission-sub">
              Lyra es parte de un esfuerzo más amplio por hacer la educación
              musical accesible: en español, sin suscripciones, con interfaces
              pensadas para distintos perfiles cognitivos, y con un modelo que
              se adapta a quien lo usa en lugar de exigir que el estudiante se
              adapte a él.
            </p>
          </div>
        </div>

        {/* mission → footer (deep navy) */}
        <SectionWave fill="#02143a" variant="chop" />
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-icon">✦</span>
            <span>Lyra</span>
          </div>
          <div className="footer-links">
            <a
              href="https://github.com/WeirdCatAFK/lyra"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a href="#what-is-lyra">Sobre</a>
            <a href="#mission">Misión</a>
          </div>
          <div className="footer-meta">
            <p>© 2026 Lyra — Open source</p>
            <p className="footer-attrib">
              Sonidos: Salamander Grand Piano V3 · Alexander Holm · CC-BY 3.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
