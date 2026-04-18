import { useEffect, useState } from "react";
import AppShell from "./AppShell.jsx";
import { clearAuth, getProgress } from "../lib/api.js";
import "./Registro-InicioS/PracticeScreen.css";

const METRIC_LABELS = {
  note_accuracy:      "Precisión melódica",
  wrong_note_rate:    "Tasa de notas erradas",
  rhythm_consistency: "Consistencia rítmica",
  tempo_deviation:    "Desviación de tempo",
  hand_independence:  "Independencia de manos",
};

// Higher is better for these; lower is better for the rest.
const HIGHER_IS_BETTER = new Set([
  "note_accuracy", "rhythm_consistency", "hand_independence",
]);

const HISTORY_LABELS = {
  recommendation_accepted: "Ejercicio recomendado",
  session_started:         "Sesión iniciada",
  session_completed:       "Sesión completada",
  exercise_completed:      "Ejercicio completado",
};

export default function ReportsPage({
  userId,
  onLogout,
  onNavigateHome,
  onNavigateToPractice,
  onNavigateToReports,
  onNavigateToExercises,
}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    getProgress(userId)
      .then((d) => { if (!cancelled) { setData(d); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Error al cargar reporte"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const handleLogout = () => { clearAuth(); onLogout?.(); };

  return (
    <AppShell
      currentPage="reports"
      userId={userId}
      onNavigateHome={onNavigateHome}
      onNavigateToPractice={onNavigateToPractice}
      onNavigateToReports={onNavigateToReports}
      onNavigateToExercises={onNavigateToExercises}
      onLogout={handleLogout}
    >
      <div style={S.page}>
        <header style={S.hero}>
          <p style={S.eyebrow}>Tu actividad real en Lyra</p>
          <h1 style={S.title}>Reporte de progreso</h1>
          <p style={S.lead}>
            Resumen calculado a partir de las métricas que Lyra ha registrado de tus sesiones.
          </p>
        </header>

        {loading && <p style={S.statusMsg}>Cargando tus datos...</p>}
        {error && <p style={{ ...S.statusMsg, color: "#ffd1dc" }}>{error}</p>}

        {!loading && !error && data && (
          <ReportContent data={data} onPractice={onNavigateToPractice} />
        )}
      </div>
    </AppShell>
  );
}

function ReportContent({ data, onPractice }) {
  const { metrics = [], history = [], n_sessions = 0 } = data;

  if (n_sessions === 0) {
    return (
      <div style={S.empty}>
        <h2 style={S.emptyTitle}>Aún no hay datos para reportar</h2>
        <p style={S.emptyText}>
          Cuando completes tu primera sesión, Lyra empezará a generar reportes con tus métricas reales.
        </p>
        <button style={S.emptyCta} onClick={onPractice}>Ir a practicar</button>
      </div>
    );
  }

  const summary = computeSummary(metrics);

  return (
    <>
      <SummaryCard summary={summary} sessionsTotal={n_sessions} />
      <MetricsCard summary={summary} />
      <SessionsCard metrics={metrics.slice(0, 10)} />
      {history.length > 0 && <HistoryCard events={history.slice(0, 12)} />}
    </>
  );
}

function SummaryCard({ summary, sessionsTotal }) {
  const overallPct = Math.round(summary.overall * 100);
  const deltaPct   = Math.round(summary.overallDelta * 100);
  const positive   = summary.overallDelta >= 0;

  return (
    <article style={S.card}>
      <div style={S.cardHead}>
        <div>
          <p style={S.cardEyebrow}>Resumen general</p>
          <h2 style={S.cardTitle}>Últimas {summary.windowSize} sesiones</h2>
        </div>
        <div style={S.scoreBlock}>
          <span style={S.scoreValue}>{overallPct}<span style={S.scoreUnit}>%</span></span>
          {summary.hasDelta && (
            <span style={positive ? S.deltaUp : S.deltaDown}>
              {positive ? "▲" : "▼"} {Math.abs(deltaPct)}
            </span>
          )}
        </div>
      </div>

      <div style={S.metaRow}>
        <span style={S.metaPill}>{sessionsTotal} sesión{sessionsTotal === 1 ? "" : "es"} totales</span>
        <span style={S.metaPill}>{formatTime(summary.totalSeconds)} de práctica</span>
        {summary.hasDelta && (
          <span style={S.metaPill}>
            Comparado con tus {summary.priorSize} sesiones anteriores
          </span>
        )}
      </div>
    </article>
  );
}

function MetricsCard({ summary }) {
  return (
    <article style={S.card}>
      <p style={S.cardEyebrow}>Promedios por métrica</p>
      <h2 style={S.cardTitle}>Cómo te ha ido por habilidad</h2>

      <div style={S.metricsList}>
        {Object.entries(summary.metricAverages).map(([key, value]) => {
          const better = HIGHER_IS_BETTER.has(key);
          // Display so that "good" is always to the right of the bar.
          const displayValue = better ? value : 1 - value;
          const pct = Math.round(displayValue * 100);
          return (
            <div key={key} style={S.metricRow}>
              <div style={S.metricHeader}>
                <span style={S.metricLabel}>
                  {METRIC_LABELS[key] || key}
                  {!better && <span style={S.metricNote}> (menos es mejor)</span>}
                </span>
                <span style={S.metricValue}>{pct}%</span>
              </div>
              <div style={S.barTrack}>
                <div style={{ ...S.barFill, width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function SessionsCard({ metrics }) {
  return (
    <article style={S.card}>
      <p style={S.cardEyebrow}>Historial de sesiones</p>
      <h2 style={S.cardTitle}>Últimas {metrics.length} sesiones</h2>

      <div style={S.sessionsList}>
        {metrics.map((m) => {
          const acc = Math.round((m.note_accuracy ?? 0) * 100);
          return (
            <div key={m.metric_id} style={S.sessionRow}>
              <div style={{ flex: 1 }}>
                <p style={S.sessionTitle}>{m.exercise_title || `Ejercicio #${m.exercise_id}`}</p>
                <p style={S.sessionMeta}>
                  {formatDate(m.timestamp)} · {formatTime(m.duration_s || 0)}
                </p>
              </div>
              <span style={S.sessionScore}>{acc}%</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HistoryCard({ events }) {
  return (
    <article style={S.card}>
      <p style={S.cardEyebrow}>Bitácora</p>
      <h2 style={S.cardTitle}>Eventos recientes</h2>

      <div style={S.historyList}>
        {events.map((ev) => {
          const label = HISTORY_LABELS[ev.event_type] || ev.event_type;
          const detail = describeHistoryPayload(ev);
          return (
            <div key={ev.history_id} style={S.historyRow}>
              <span style={S.historyDot} />
              <div style={{ flex: 1 }}>
                <p style={S.historyLabel}>{label}</p>
                {detail && <p style={S.historyDetail}>{detail}</p>}
              </div>
              <span style={S.historyTime}>{formatDate(ev.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function computeSummary(metrics) {
  // metrics arrive sorted DESC by timestamp.
  const total = metrics.length;
  const window = metrics.slice(0, Math.min(5, total));
  const prior  = metrics.slice(window.length, window.length + 5);

  const avg = (rows, key) => rows.length === 0
    ? 0
    : rows.reduce((s, r) => s + (r[key] ?? 0), 0) / rows.length;

  const metricKeys = Object.keys(METRIC_LABELS);
  const metricAverages = {};
  for (const k of metricKeys) metricAverages[k] = avg(metrics, k);

  // Overall = average note_accuracy across the window.
  const overall      = avg(window, "note_accuracy");
  const overallPrior = avg(prior,  "note_accuracy");

  const totalSeconds = metrics.reduce((s, r) => s + (r.duration_s || 0), 0);

  return {
    overall,
    overallDelta: overall - overallPrior,
    hasDelta:     prior.length > 0,
    windowSize:   window.length,
    priorSize:    prior.length,
    metricAverages,
    totalSeconds,
  };
}

function formatTime(seconds) {
  const s = Math.round(seconds || 0);
  if (s < 60) return `${s}s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return `${h}h ${r}min`;
}

function formatDate(ts) {
  if (!ts) return "—";
  // SQLite returns "YYYY-MM-DD HH:MM:SS" in UTC.
  const iso = ts.includes("T") ? ts : ts.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function describeHistoryPayload(ev) {
  const p = ev.payload;
  if (!p || typeof p !== "object") return null;
  if (ev.event_type === "recommendation_accepted") {
    const by = p.selected_by ? ` (vía ${p.selected_by})` : "";
    return p.exercise_id ? `Ejercicio #${p.exercise_id}${by}` : null;
  }
  if (p.exercise_id) return `Ejercicio #${p.exercise_id}`;
  return null;
}

// ─── styles ──────────────────────────────────────────────────────────────────

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

  statusMsg: { textAlign: "center", padding: "2rem", opacity: 0.85 },

  empty: {
    background: "#fff", color: NAVY, borderRadius: 18,
    padding: "2.5rem 1.75rem", textAlign: "center",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center",
  },
  emptyTitle: { fontSize: "1.25rem", fontWeight: 700, color: NAVY },
  emptyText:  { fontSize: "0.95rem", color: "rgba(2,26,84,0.7)", lineHeight: 1.55, maxWidth: 480 },
  emptyCta: {
    marginTop: "0.5rem", background: PINK, color: "#fff", border: "none",
    borderRadius: 999, padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
  },

  card: {
    background: "#fff", color: NAVY, borderRadius: 18,
    padding: "1.5rem 1.75rem", boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "1rem",
  },
  cardHead: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: "1rem",
  },
  cardEyebrow: {
    fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
    color: PINK, fontWeight: 700,
  },
  cardTitle: { fontSize: "1.25rem", fontWeight: 700, color: NAVY },

  scoreBlock: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" },
  scoreValue: { fontSize: "2rem", fontWeight: 800, color: NAVY, lineHeight: 1 },
  scoreUnit:  { fontSize: "0.9rem", fontWeight: 500, color: "rgba(2,26,84,0.5)", marginLeft: 2 },
  deltaUp: {
    fontSize: "0.78rem", fontWeight: 600, color: "#1e7a4a",
    background: "rgba(30,122,74,0.10)", padding: "0.15rem 0.5rem", borderRadius: 999,
  },
  deltaDown: {
    fontSize: "0.78rem", fontWeight: 600, color: "#c03820",
    background: "rgba(192,56,32,0.10)", padding: "0.15rem 0.5rem", borderRadius: 999,
  },

  metaRow:  { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  metaPill: {
    fontSize: "0.78rem", color: "rgba(2,26,84,0.7)", fontWeight: 500,
    background: "rgba(2,26,84,0.06)", padding: "0.25rem 0.65rem", borderRadius: 999,
  },

  metricsList:  { display: "flex", flexDirection: "column", gap: "0.85rem" },
  metricRow:    { display: "flex", flexDirection: "column", gap: "0.35rem" },
  metricHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  metricLabel:  { fontSize: "0.85rem", color: "rgba(2,26,84,0.75)", fontWeight: 500 },
  metricNote:   { fontSize: "0.7rem", color: "rgba(2,26,84,0.45)", fontWeight: 400, marginLeft: 4 },
  metricValue:  { fontSize: "0.92rem", color: NAVY, fontWeight: 600 },
  barTrack: {
    width: "100%", height: 6, backgroundColor: "rgba(2,26,84,0.08)",
    borderRadius: 999, overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${PINK}, #ff85bb)`,
    borderRadius: 999, transition: "width 0.4s ease",
  },

  sessionsList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  sessionRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.6rem 0", borderTop: "1px solid rgba(2,26,84,0.06)", gap: "1rem",
  },
  sessionTitle: { fontSize: "0.95rem", fontWeight: 600, color: NAVY },
  sessionMeta:  { fontSize: "0.78rem", color: "rgba(2,26,84,0.55)", marginTop: "0.15rem" },
  sessionScore: { fontSize: "1rem", fontWeight: 700, color: PINK },

  historyList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  historyRow:  {
    display: "flex", alignItems: "flex-start", gap: "0.75rem",
    padding: "0.5rem 0", borderTop: "1px solid rgba(2,26,84,0.06)",
  },
  historyDot: {
    width: 8, height: 8, borderRadius: "50%", background: PINK,
    marginTop: 6, flexShrink: 0,
  },
  historyLabel:  { fontSize: "0.9rem", fontWeight: 600, color: NAVY },
  historyDetail: { fontSize: "0.78rem", color: "rgba(2,26,84,0.6)", marginTop: "0.15rem" },
  historyTime:   { fontSize: "0.78rem", color: "rgba(2,26,84,0.5)", whiteSpace: "nowrap" },
};
