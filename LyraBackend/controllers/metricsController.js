const db = require('../db/connection');
const { run, all } = require('../db/helpers');

const METRIC_FIELDS = [
    'note_accuracy', 'wrong_note_rate', 'missed_note_rate', 'tempo_deviation',
    'rhythm_consistency', 'note_length_accuracy', 'velocity_mean', 'velocity_variance',
    'legato_adherence', 'hand_independence',
];

exports.saveMetrics = async (req, res) => {
    const { user_id, exercise_id, duration_s, session_id, metric_vector = {} } = req.body;

    try {
        const vals = METRIC_FIELDS.map(f => metric_vector[f] ?? 0);
        const placeholders = METRIC_FIELDS.map(() => '?').join(', ');

        const mvResult = await run(
            `INSERT INTO Metric_Vector (${METRIC_FIELDS.join(', ')}) VALUES (${placeholders})`,
            vals
        );

        const umResult = await run(
            `INSERT INTO User_metrics (user_id, exercise_id, duration_s, session_id, timestamp, metric_vector_id)
             VALUES (?, ?, ?, ?, datetime('now'), ?)`,
            [user_id, exercise_id, duration_s, session_id, mvResult.lastID]
        );

        res.json({ metric_id: umResult.lastID, metric_vector_id: mvResult.lastID });
    } catch (err) {
        console.error("saveMetrics error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getUserMetrics = (req, res) => {
    db.all(
        `SELECT um.*, mv.note_accuracy, mv.wrong_note_rate, mv.missed_note_rate, mv.tempo_deviation,
                mv.rhythm_consistency, mv.note_length_accuracy, mv.velocity_mean, mv.velocity_variance,
                mv.legato_adherence, mv.hand_independence
         FROM User_metrics um
         LEFT JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
         WHERE um.user_id = ?
         ORDER BY um.timestamp DESC`,
        [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};

exports.getSessionMetrics = (req, res) => {
    db.all(
        `SELECT um.*, mv.note_accuracy, mv.wrong_note_rate, mv.missed_note_rate, mv.tempo_deviation,
                mv.rhythm_consistency, mv.note_length_accuracy, mv.velocity_mean, mv.velocity_variance,
                mv.legato_adherence, mv.hand_independence
         FROM User_metrics um
         LEFT JOIN Metric_Vector mv ON um.metric_vector_id = mv.metric_id
         WHERE um.session_id = ?`,
        [req.params.session_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};
