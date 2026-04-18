import { useEffect, useMemo, useState } from "react";
import AppShell from "./AppShell.jsx";
import { clearAuth, getExercises } from "../lib/api.js";
import "./Registro-InicioS/PracticeScreen.css";

const SOURCE_BADGES = {
  seed: { label: "Catálogo",     long: "Del catálogo de Lyra",      icon: "♪" },
  llm:  { label: "IA generado",  long: "Compuesto por la capa LLM", icon: "✨" },
  cnn:  { label: "Sugerido IA",  long: "Sugerido por la CNN",       icon: "◆" },
};

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "llm", label: "Generados por IA" },
  { key: "seed", label: "Catálogo" },
];

export default function AiExercisesPage({
  userId,
  onLogout,
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
}) {
  const [exercises, setExercises] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getExercises()
      .then((rows) => { if (!cancelled) { setExercises(rows || []); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Error al cargar ejercicios"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => { clearAuth(); onLogout?.(); };

  const visible = useMemo(() => {
    if (filter === "all") return exercises;
    return exercises.filter((e) => (e.generated_by || "seed") === filter);
  }, [exercises, filter]);

  const counts = useMemo(() => {
    const c = { all: exercises.length, llm: 0, seed: 0 };
    for (const e of exercises) {
      const src = e.generated_by || "seed";
      c[src] = (c[src] || 0) + 1;
    }
    return c;
  }, [exercises]);

  return (
    <AppShell
      currentPage="exercises"
      userId={userId}
      onNavigateHome={onNavigateHome}
      onNavigateToPractice={onNavigateToPractice}
      onNavigateToReports={onNavigateToReports}
      onNavigateToExercises={onNavigateToExercises}
      onLogout={handleLogout}
    >
      <div style={S.page}>
        <header style={S.hero}>
          <p style={S.eyebrow}>Catálogo de Lyra</p>
          <h1 style={S.title}>Ejercicios disponibles</h1>
          <p style={S.lead}>
            Todo lo que Lyra puede ofrecerte ahora mismo: el catálogo curado más cualquier
            ejercicio que la capa LLM haya compuesto para ti. Cuando la capa LLM esté activa
            y detecte un punto débil sin cobertura en el catálogo, los nuevos ejercicios
            aparecen aquí marcados como <strong>Generados por IA</strong>.
          </p>
        </header>

        <div style={S.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={filter === f.key ? S.filterActive : S.filterBtn}
            >
              {f.label} <span style={S.filterCount}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading && <p style={S.statusMsg}>Cargando catálogo...</p>}
        {error   && <p style={{ ...S.statusMsg, color: "#ffd1dc" }}>{error}</p>}

        {!loading && !error && visible.length === 0 && (
          <div style={S.empty}>
            <h2 style={S.emptyTitle}>Sin ejercicios en esta vista</h2>
            <p style={S.emptyText}>
              {filter === "llm"
                ? "Aún no hay ejercicios generados por la capa LLM. Aparecerán aquí cuando la capa esté activa y detecte un punto débil sin cobertura."
                : "El catálogo está vacío. Pide al equipo que ejecute el seed inicial."}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div style={S.list}>
            {visible.map((ex) => (
              <ExerciseCard key={ex.exercise_id} exercise={ex} onPractice={onNavigateToPractice} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ExerciseCard({ exercise, onPractice }) {
  const targets = parseSkills(exercise.target_skills);
  const source  = exercise.generated_by || "seed";
  const isAi    = source === "llm" || source === "cnn";
  const badge   = SOURCE_BADGES[source] || SOURCE_BADGES.seed;

  return (
    <article style={isAi ? { ...S.card, ...S.cardAi } : { ...S.card, ...S.cardSeed }}>
      <div style={S.sourceRow}>
        <span style={isAi ? S.sourceBadgeAi : S.sourceBadgeSeed} title={badge.long}>
          <span style={S.sourceIcon}>{badge.icon}</span>
          {badge.label}
        </span>
        <Difficulty value={exercise.difficulty} />
      </div>

      <div>
        <h2 style={S.cardTitle}>{exercise.title || `Ejercicio #${exercise.exercise_id}`}</h2>
        <p style={S.cardSub}>{badge.long}</p>
      </div>

      {targets.length > 0 && (
        <div style={S.tagsRow}>
          <span style={S.tagLabel}>Habilidades</span>
          <div style={S.tagsList}>
            {targets.map((t) => (
              <span key={t} style={S.targetPill}>{prettyLabel(t)}</span>
            ))}
          </div>
        </div>
      )}

      <div style={S.cardFooter}>
        <span style={S.idPill}>ID #{exercise.exercise_id}</span>
        <button style={S.cardCta} type="button" onClick={onPractice}>
          Ir a practicar →
        </button>
      </div>
    </article>
  );
}

function Difficulty({ value }) {
  const v = Math.max(1, Math.min(5, Number(value) || 1));
  return (
    <div style={S.difficulty}>
      <span style={S.diffLabel}>Dificultad</span>
      <span style={S.diffStars}>
        {"★".repeat(v)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - v)}</span>
      </span>
    </div>
  );
}

function parseSkills(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function prettyLabel(s) {
  return String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const NAVY = "#021a54";
const PINK = "#ff5fa2";

const S = {
  page: {
    maxWidth: 880, margin: "0 auto", padding: "2.5rem 1.5rem 4rem",
    color: "#f5f5f5", fontFamily: "Poppins, sans-serif",
    display: "flex", flexDirection: "column", gap: "1.25rem",
  },
  hero: { marginBottom: "0.5rem", textAlign: "center" },
  eyebrow: {
    fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase",
    color: "#ffcee3", fontWeight: 600, marginBottom: "0.5rem",
  },
  title: { fontSize: "2.25rem", fontWeight: 800, color: "#fff", marginBottom: "0.75rem" },
  lead: { fontSize: "1rem", lineHeight: 1.6, opacity: 0.85, maxWidth: 640, margin: "0 auto" },

  filters: { display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" },
  filterBtn: {
    background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999, padding: "0.4rem 0.95rem",
    fontSize: "0.85rem", fontWeight: 500, fontFamily: "inherit",
    cursor: "pointer", transition: "all 0.15s ease",
  },
  filterActive: {
    background: PINK, color: "#fff", border: "1px solid transparent",
    borderRadius: 999, padding: "0.4rem 0.95rem",
    fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
  },
  filterCount: {
    marginLeft: "0.4rem", padding: "0.05rem 0.4rem",
    background: "rgba(255,255,255,0.18)", borderRadius: 999, fontSize: "0.72rem",
  },

  statusMsg: { textAlign: "center", padding: "2rem", opacity: 0.85 },

  empty: {
    background: "#fff", color: NAVY, borderRadius: 18,
    padding: "2.5rem 1.75rem", textAlign: "center",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center",
  },
  emptyTitle: { fontSize: "1.2rem", fontWeight: 700, color: NAVY },
  emptyText: {
    fontSize: "0.9rem", color: "rgba(2,26,84,0.7)", lineHeight: 1.55, maxWidth: 480,
  },

  list: { display: "flex", flexDirection: "column", gap: "1rem" },

  card: {
    background: "#fff", color: NAVY, borderRadius: 18,
    padding: "1.5rem 1.75rem", boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "1rem",
  },
  cardSeed: { borderLeft: `6px solid ${NAVY}` },
  cardAi:   { borderLeft: `6px solid ${PINK}` },

  sourceRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: "1rem",
  },
  sourceBadgeSeed: {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    fontSize: "0.72rem", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#fff", background: NAVY,
    padding: "0.3rem 0.7rem", borderRadius: 999,
  },
  sourceBadgeAi: {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    fontSize: "0.72rem", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#fff",
    background: `linear-gradient(135deg, ${PINK} 0%, #ff85bb 100%)`,
    padding: "0.3rem 0.7rem", borderRadius: 999,
    boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
  },
  sourceIcon: { fontSize: "0.85rem", lineHeight: 1 },

  cardTitle: { fontSize: "1.15rem", fontWeight: 700, color: NAVY, lineHeight: 1.25 },
  cardSub: {
    fontSize: "0.78rem", color: "rgba(2,26,84,0.55)",
    fontWeight: 500, marginTop: "0.25rem",
  },

  difficulty: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.15rem" },
  diffLabel: {
    fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
    color: "rgba(2,26,84,0.5)", fontWeight: 600,
  },
  diffStars: { color: PINK, fontSize: "0.95rem", letterSpacing: "0.05em" },

  tagsRow: {
    display: "flex", flexDirection: "column", gap: "0.4rem",
    paddingTop: "0.5rem", borderTop: "1px solid rgba(2,26,84,0.08)",
  },
  tagLabel: {
    fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
    color: "rgba(2,26,84,0.5)", fontWeight: 600,
  },
  tagsList: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  targetPill: {
    fontSize: "0.78rem", color: NAVY, fontWeight: 500,
    background: "rgba(255,95,162,0.10)", padding: "0.25rem 0.65rem", borderRadius: 999,
    border: "1px solid rgba(255,95,162,0.25)",
  },

  cardFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "0.5rem", borderTop: "1px solid rgba(2,26,84,0.08)",
  },
  idPill: {
    fontSize: "0.78rem", color: "rgba(2,26,84,0.55)", fontWeight: 500,
    background: "rgba(2,26,84,0.06)", padding: "0.25rem 0.65rem", borderRadius: 999,
  },
  cardCta: {
    background: PINK, color: "#fff", border: "none", borderRadius: 999,
    padding: "0.55rem 1.25rem", fontSize: "0.9rem", fontWeight: 600,
    fontFamily: "inherit", cursor: "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
  },
};
