PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    learning_objectives TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Exercises (
    exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    difficulty INTEGER,
    target_skills TEXT,
    notation TEXT,
    metric_schema TEXT,
    generated_by TEXT
);

CREATE TABLE IF NOT EXISTS Sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    exercise_id INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT,
    strategy_hint TEXT,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(exercise_id) REFERENCES Exercises(exercise_id)
);

CREATE TABLE IF NOT EXISTS User_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT,
    payload TEXT,
    timestamp TIMESTAMP,
    session_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(session_id) REFERENCES Sessions(session_id)
);

CREATE TABLE IF NOT EXISTS Metric_Vector (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    missed_note_rate REAL,
    tempo_deviation REAL,
    rhythm_consistency REAL,
    note_length_accuracy REAL,
    velocity_mean REAL,
    velocity_variance REAL,
    legato_adherence REAL,
    hand_independence REAL,
    note_accuracy REAL,
    wrong_note_rate REAL
);

CREATE TABLE IF NOT EXISTS User_metrics (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    exercise_id INTEGER,
    duration_s REAL,
    timestamp TIMESTAMP,
    session_id INTEGER,
    metric_vector_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(exercise_id) REFERENCES Exercises(exercise_id),
    FOREIGN KEY(session_id) REFERENCES Sessions(session_id),
    FOREIGN KEY(metric_vector_id) REFERENCES Metric_Vector(metric_id)
);

CREATE TABLE IF NOT EXISTS Cnn_training_data (
    id_cnn INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER,
    history_snapshot TEXT,
    exercise_difficulty TEXT,
    improvement_delta REAL,
    timestamp TIMESTAMP,
    session_id INTEGER,
    FOREIGN KEY(exercise_id) REFERENCES Exercises(exercise_id),
    FOREIGN KEY(session_id) REFERENCES Sessions(session_id)
);