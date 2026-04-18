const db = require('../db/connection');

exports.saveMetrics = (req, res) => {
    const { user_id, exercise_id, duration_s, session_id } = req.body;

    db.run(
        `INSERT INTO User_metrics 
        (user_id, exercise_id, duration_s, session_id, timestamp) 
        VALUES (?, ?, ?, ?, datetime('now'))`, [user_id, exercise_id, duration_s, session_id],
        function(err) {
            if (err) {
                console.error("SQL ERROR:", err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({ metric_id: this.lastID });
        }
    );
};

exports.getUserMetrics = (req, res) => {
    db.all(
        "SELECT * FROM User_metrics WHERE user_id = ?", [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

exports.getSessionMetrics = (req, res) => {
    db.all(
        "SELECT * FROM User_metrics WHERE session_id = ?", [req.params.session_id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};