const db = require('../db/connection');
const bcrypt = require('bcrypt');
const config = require('../config');
const { get, all, run } = require('../db/helpers');

function safeJson(val, fallback) {
    if (val == null) return fallback;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return fallback; }
}

function safeJsonStr(val, fallback = '[]') {
    const parsed = safeJson(val, null);
    if (parsed !== null) return val;          // already valid JSON string
    return fallback;
}


exports.getUsers = (req, res) => {
    db.all("SELECT user_id, username, email, created_at FROM Users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};


exports.getUser = (req, res) => {
    db.get(
        "SELECT user_id, username, email, created_at FROM Users WHERE user_id = ?", [req.params.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row || { message: "Usuario no encontrado" });
        }
    );
};


exports.createUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        const hash = await bcrypt.hash(password, config.security.saltRounds);

        db.run(
            "INSERT INTO Users (username, email, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))",
            [username, email, hash],
            function(err) {
                if (err) {
                    if (err.message.includes("UNIQUE")) {
                        return res.status(400).json({ error: "El email ya está registrado" });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: "Usuario creado", user_id: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateUser = (req, res) => {
    const { username, email } = req.body;

    db.run(
        "UPDATE Users SET username = ?, email = ? WHERE user_id = ?",
        [username, email, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Usuario actualizado", updated: this.changes });
        }
    );
};


exports.deleteUser = (req, res) => {
    db.run(
        "DELETE FROM Users WHERE user_id = ?", [req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Usuario eliminado", deleted: this.changes });
        }
    );
};


exports.nextExercise = async (req, res) => {
    const user_id = req.params.id;

    try {
        const user = await get("SELECT * FROM Users WHERE user_id = ?", [user_id]);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Session count drives CNN epsilon
        const countRow = await get("SELECT COUNT(*) as n FROM User_metrics WHERE user_id = ?", [user_id]);
        const n_sessions = countRow?.n || 0;

        // Last 10 metric vectors (oldest first)
        const metricRows = await all(
            `SELECT mv.* FROM User_metrics um
             JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
             WHERE um.user_id = ?
             ORDER BY um.timestamp DESC LIMIT 10`,
            [user_id]
        );
        const recent_metrics = metricRows.map(r => ({
            note_accuracy: r.note_accuracy || 0,
            wrong_note_rate: r.wrong_note_rate || 0,
            missed_note_rate: r.missed_note_rate || 0,
            tempo_deviation: r.tempo_deviation || 0,
            rhythm_consistency: r.rhythm_consistency || 0,
            note_length_accuracy: r.note_length_accuracy || 0,
            velocity_mean: r.velocity_mean || 0,
            velocity_variance: r.velocity_variance || 0,
            legato_adherence: r.legato_adherence || 0,
            hand_independence: r.hand_independence || 0,
        })).reverse();

        const exercises = await all("SELECT * FROM Exercises", []);
        if (!exercises.length) return res.status(503).json({ error: "No exercises available" });

        const exerciseInputs = exercises.map(ex => ({
            exercise_id: String(ex.exercise_id),
            title: ex.title,
            difficulty: ex.difficulty,
            target_skills: safeJsonStr(ex.target_skills),
        }));

        // Call LyraAI
        let exerciseId, strategyHint = null, selectedBy = 'deterministic', llmActive = false;
        try {
            const aiUrl = process.env.LYRA_AI_URL || 'http://localhost:8001';
            const aiRes = await fetch(`${aiUrl}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: String(user_id),
                    learning_objectives: JSON.parse(user.learning_objectives || '[]'),
                    n_sessions,
                    recent_metrics,
                    exercises: exerciseInputs,
                }),
                signal: AbortSignal.timeout(8000),
            });
            if (aiRes.ok) {
                const aiData = await aiRes.json();
                exerciseId = aiData.exercise_id;
                strategyHint = aiData.strategy_hint || null;
                selectedBy = aiData.selected_by || 'deterministic';
                llmActive = !!aiData.llm_active;
            }
        } catch (e) {
            console.warn("LyraAI unreachable, using fallback:", e.message);
        }

        // Fallback: easiest exercise
        if (!exerciseId) {
            const sorted = [...exercises].sort((a, b) => a.difficulty - b.difficulty);
            exerciseId = String(sorted[0].exercise_id);
        }

        const exercise = exercises.find(ex => String(ex.exercise_id) === String(exerciseId));
        if (!exercise) return res.status(500).json({ error: "Resolved exercise not found" });

        // Create session
        const sessResult = await run(
            "INSERT INTO Sessions (user_id, exercise_id, started_at, status, strategy_hint) VALUES (?, ?, datetime('now'), 'active', ?)",
            [user_id, exercise.exercise_id, strategyHint]
        );
        const session_id = sessResult.lastID;

        // Log history
        run(
            "INSERT INTO User_history (user_id, event_type, payload, timestamp, session_id) VALUES (?, 'recommendation_accepted', ?, datetime('now'), ?)",
            [user_id, JSON.stringify({ exercise_id: exercise.exercise_id, selected_by: selectedBy }), session_id]
        ).catch(e => console.warn("History log error:", e.message));

        res.json({
            session_id,
            exercise: {
                exercise_id: exercise.exercise_id,
                title: exercise.title,
                difficulty: exercise.difficulty,
                target_skills: safeJson(exercise.target_skills, []),
                notation:      safeJson(exercise.notation,      {}),
                metric_schema: safeJson(exercise.metric_schema, {}),
                generated_by:  exercise.generated_by,
            },
            strategy_hint: strategyHint,
            selected_by: selectedBy,
            llm_active: llmActive,
        });
    } catch (err) {
        console.error("nextExercise error:", err.message);
        res.status(500).json({ error: err.message });
    }
};


exports.getProgress = async (req, res) => {
    const user_id = req.params.id;

    try {
        const metrics = await all(
            `SELECT um.metric_id, um.exercise_id, ex.title as exercise_title,
                    um.duration_s, um.timestamp,
                    mv.note_accuracy, mv.wrong_note_rate, mv.rhythm_consistency,
                    mv.tempo_deviation, mv.hand_independence
             FROM User_metrics um
             LEFT JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
             LEFT JOIN Exercises ex ON um.exercise_id = ex.exercise_id
             WHERE um.user_id = ?
             ORDER BY um.timestamp DESC LIMIT 50`,
            [user_id]
        );

        const history = await all(
            "SELECT * FROM User_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100",
            [user_id]
        );

        res.json({
            user_id,
            n_sessions: metrics.length,
            metrics,
            history: history.map(h => ({ ...h, payload: JSON.parse(h.payload || '{}') })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
