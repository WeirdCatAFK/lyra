const db = require('../db/connection');

exports.saveTrainingData = (req, res) => {
    const { user_id, exercise_id, history_snapshot, exercise_difficulty, exercise_skills, improvement_delta, session_id } = req.body;

    db.run(
        `INSERT INTO Cnn_training_data
         (user_id, exercise_id, history_snapshot, exercise_difficulty, exercise_skills, improvement_delta, timestamp, session_id)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [user_id, exercise_id, history_snapshot, exercise_difficulty, exercise_skills, improvement_delta, session_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
};

exports.getTrainingData = (req, res) => {
    db.all("SELECT * FROM Cnn_training_data", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.getUserTrainingData = (req, res) => {
    db.all(
        "SELECT * FROM Cnn_training_data WHERE user_id = ? ORDER BY timestamp ASC",
        [req.params.user_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};
