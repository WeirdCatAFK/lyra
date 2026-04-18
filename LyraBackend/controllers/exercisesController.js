const db = require('../db/connection');

exports.getExercises = (req, res) => {
    db.all("SELECT * FROM Exercises", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
};

exports.getExercise = (req, res) => {
    db.get("SELECT * FROM Exercises WHERE exercise_id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json(err);
        res.json(row);
    });
};

exports.createExercise = (req, res) => {
    const { title, difficulty, target_skills } = req.body;

    db.run(
        "INSERT INTO Exercises (title, difficulty, target_skills) VALUES (?, ?, ?)", [title, difficulty, target_skills],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ id: this.lastID });
        }
    );
};

exports.updateExercise = (req, res) => {
    const { title, difficulty } = req.body;

    db.run(
        "UPDATE Exercises SET title = ?, difficulty = ? WHERE exercise_id = ?", [title, difficulty, req.params.id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ updated: this.changes });
        }
    );
};

exports.deleteExercise = (req, res) => {
    db.run(
        "DELETE FROM Exercises WHERE exercise_id = ?", [req.params.id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ deleted: this.changes });
        }
    );
};