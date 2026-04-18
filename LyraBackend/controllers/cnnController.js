const db = require('../db/connection');

exports.saveTrainingData = (req, res) => {
    const { exercise_id, history_snapshot, improvement_delta, session_id } = req.body;

    db.run(
        "INSERT INTO Cnn_training_data (exercise_id, history_snapshot, improvement_delta, timestap, session_id) VALUES (?, ?, ?, datetime('now'), ?)", [exercise_id, history_snapshot, improvement_delta, session_id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
};

exports.getTrainingData = (req, res) => {
    db.all("SELECT * FROM Cnn_training_data", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
};