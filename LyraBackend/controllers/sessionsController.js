const db = require('../db/connection');
const { get, all, run } = require('../db/helpers');

function safeJsonStr(val, fallback = '[]') {
    if (val == null) return fallback;
    try { JSON.parse(val); return val; } catch { return fallback; }
}

const METRIC_FIELDS = [
    'note_accuracy', 'wrong_note_rate', 'missed_note_rate', 'tempo_deviation',
    'rhythm_consistency', 'note_length_accuracy', 'velocity_mean', 'velocity_variance',
    'legato_adherence', 'hand_independence',
];

const LOWER_IS_BETTER = new Set(['wrong_note_rate', 'missed_note_rate', 'tempo_deviation']);

function computeImprovementDelta(newVec, prevVec) {
    const deltas = METRIC_FIELDS.map(m => {
        let d = (newVec[m] || 0) - (prevVec[m] || 0);
        if (LOWER_IS_BETTER.has(m)) d = -d;
        return d;
    });
    const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length;
    return Math.max(-1, Math.min(1, mean));
}

function rowToVec(row) {
    if (!row) return {};
    return Object.fromEntries(METRIC_FIELDS.map(f => [f, row[f] || 0]));
}

// ── existing endpoints ────────────────────────────────────────────────────────

exports.startSession = (req, res) => {
    const { user_id, exercise_id } = req.body;

    db.run(
        "INSERT INTO Sessions (user_id, exercise_id, started_at, status) VALUES (?, ?, datetime('now'), 'active')",
        [user_id, exercise_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ session_id: this.lastID });
        }
    );
};

exports.endSession = (req, res) => {
    const { session_id } = req.body;

    db.run(
        "UPDATE Sessions SET completed_at = datetime('now'), status = 'completed' WHERE session_id = ?",
        [session_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ finished: true });
        }
    );
};

exports.getSession = (req, res) => {
    db.get(
        "SELECT * FROM Sessions WHERE session_id = ?", [req.params.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row);
        }
    );
};

exports.getUserSessions = (req, res) => {
    db.all(
        "SELECT * FROM Sessions WHERE user_id = ?", [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};

// ── complete session ──────────────────────────────────────────────────────────

exports.completeSession = async (req, res) => {
    const { id: session_id } = req.params;
    const { metric_vector = {}, duration_s = 0 } = req.body;

    try {
        const sess = await get("SELECT * FROM Sessions WHERE session_id = ?", [session_id]);
        if (!sess) return res.status(404).json({ error: "Session not found" });
        if (sess.status !== 'active') return res.status(409).json({ error: "Session already completed" });

        const { user_id, exercise_id } = sess;

        // Previous metric for this user/exercise (improvement delta)
        const prevRow = await get(
            `SELECT mv.* FROM User_metrics um
             JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
             WHERE um.user_id = ? AND um.exercise_id = ?
             ORDER BY um.timestamp DESC LIMIT 1`,
            [user_id, exercise_id]
        );
        const improvement_delta = computeImprovementDelta(metric_vector, rowToVec(prevRow));

        // Close session
        await run(
            "UPDATE Sessions SET completed_at = datetime('now'), status = 'completed' WHERE session_id = ?",
            [session_id]
        );

        // Save metric vector
        const vals = METRIC_FIELDS.map(f => metric_vector[f] ?? 0);
        const placeholders = METRIC_FIELDS.map(() => '?').join(', ');
        const mvResult = await run(
            `INSERT INTO Metric_Vector (${METRIC_FIELDS.join(', ')}) VALUES (${placeholders})`, vals
        );

        await run(
            `INSERT INTO User_metrics (user_id, exercise_id, duration_s, session_id, timestamp, metric_vector_id)
             VALUES (?, ?, ?, ?, datetime('now'), ?)`,
            [user_id, exercise_id, duration_s, session_id, mvResult.lastID]
        );

        // Build history snapshot (last 10 metric vectors for this user)
        const histRows = await all(
            `SELECT mv.* FROM User_metrics um
             JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
             WHERE um.user_id = ?
             ORDER BY um.timestamp DESC LIMIT 10`,
            [user_id]
        );
        const history_snapshot = histRows.map(rowToVec).reverse();

        // Get exercise metadata
        const exercise = await get("SELECT * FROM Exercises WHERE exercise_id = ?", [exercise_id]);

        // Save CNN training data
        await run(
            `INSERT INTO Cnn_training_data
             (user_id, exercise_id, history_snapshot, exercise_difficulty, exercise_skills, improvement_delta, timestamp, session_id)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
            [
                user_id, exercise_id,
                JSON.stringify(history_snapshot),
                exercise?.difficulty || 1,
                safeJsonStr(exercise?.target_skills),
                improvement_delta,
                session_id,
            ]
        );

        // Log history event
        await run(
            `INSERT INTO User_history (user_id, event_type, payload, timestamp, session_id)
             VALUES (?, 'completed', ?, datetime('now'), ?)`,
            [user_id, JSON.stringify({ session_id, exercise_id, duration_s, improvement_delta }), session_id]
        );

        // Fire-and-forget: send all training samples to LyraAI
        all(
            "SELECT history_snapshot, exercise_difficulty, exercise_skills, improvement_delta FROM Cnn_training_data WHERE user_id = ? ORDER BY timestamp ASC",
            [user_id]
        ).then(samples => {
            const aiUrl = process.env.LYRA_AI_URL || 'http://localhost:8001';
            fetch(`${aiUrl}/train/${user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    samples: samples.map(s => ({
                        history_snapshot: JSON.parse(s.history_snapshot || '[]'),
                        exercise_difficulty: s.exercise_difficulty,
                        exercise_skills: s.exercise_skills || '[]',
                        improvement_delta: s.improvement_delta,
                    })),
                }),
            }).catch(e => console.warn("LyraAI train call failed:", e.message));
        });

        res.json({ metric_id: mvResult.lastID, improvement_delta });
    } catch (err) {
        console.error("completeSession error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
