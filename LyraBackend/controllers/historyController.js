const db = require('../db/connection');

exports.saveEvent = (req, res) => {
    const { user_id, event_type, payload, session_id } = req.body;

    db.run(
        "INSERT INTO User_history (user_id, event_type, payload, timestamp, session_id) VALUES (?, ?, ?, datetime('now'), ?)", [user_id, event_type, payload, session_id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ history_id: this.lastID });
        }
    );
};

exports.getUserHistory = (req, res) => {
    db.all(
        "SELECT * FROM User_history WHERE user_id = ?", [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};