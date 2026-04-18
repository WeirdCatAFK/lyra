const db = require('../db/connection');

exports.startSession = (req, res) => {
    const { user_id, exercise_id } = req.body;

    db.run(
        "INSERT INTO Sessions (user_id, exercise_id, started_at, status) VALUES (?, ?, datetime('now'), 'active')", [user_id, exercise_id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ session_id: this.lastID });
        }
    );
};

exports.endSession = (req, res) => {
    const { session_id } = req.body;

    db.run(
        "UPDATE Sessions SET completed_at = datetime('now'), status = 'completed' WHERE session_id = ?", [session_id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ finished: true });
        }
    );
};

exports.getSession = (req, res) => {
    db.get(
        "SELECT * FROM Sessions WHERE session_id = ?", [req.params.id],
        (err, row) => {
            if (err) return res.status(500).json(err);
            res.json(row);
        }
    );
};

exports.getUserSessions = (req, res) => {
    db.all(
        "SELECT * FROM Sessions WHERE user_id = ?", [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};