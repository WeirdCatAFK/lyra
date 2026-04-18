PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Users (
    user_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username            TEXT,
    email               TEXT UNIQUE,
    password_hash       TEXT,
    learning_objectives TEXT DEFAULT '[]',
    created_at          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Exercises (
    exercise_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT,
    difficulty      INTEGER,
    target_skills   TEXT DEFAULT '[]',
    notation        TEXT DEFAULT '{}',
    metric_schema   TEXT DEFAULT '{}',
    generated_by    TEXT DEFAULT 'seed'
);

CREATE TABLE IF NOT EXISTS Sessions (
    session_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER,
    exercise_id     INTEGER,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    status          TEXT DEFAULT 'active',
    strategy_hint   TEXT,
    FOREIGN KEY(user_id)     REFERENCES Users(user_id),
    FOREIGN KEY(exercise_id) REFERENCES Exercises(exercise_id)
);

CREATE TABLE IF NOT EXISTS User_history (
    history_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    event_type  TEXT,
    payload     TEXT DEFAULT '{}',
    timestamp   TIMESTAMP,
    session_id  INTEGER,
    FOREIGN KEY(user_id)    REFERENCES Users(user_id),
    FOREIGN KEY(session_id) REFERENCES Sessions(session_id)
);

CREATE TABLE IF NOT EXISTS Metric_Vector (
    metric_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    note_accuracy       REAL DEFAULT 0,
    wrong_note_rate     REAL DEFAULT 0,
    missed_note_rate    REAL DEFAULT 0,
    tempo_deviation     REAL DEFAULT 0,
    rhythm_consistency  REAL DEFAULT 0,
    note_length_accuracy REAL DEFAULT 0,
    velocity_mean       REAL DEFAULT 0,
    velocity_variance   REAL DEFAULT 0,
    legato_adherence    REAL DEFAULT 0,
    hand_independence   REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS User_metrics (
    metric_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER,
    exercise_id      INTEGER,
    duration_s       REAL,
    timestamp        TIMESTAMP,
    session_id       INTEGER,
    metric_vector_id INTEGER,
    FOREIGN KEY(user_id)          REFERENCES Users(user_id),
    FOREIGN KEY(exercise_id)      REFERENCES Exercises(exercise_id),
    FOREIGN KEY(session_id)       REFERENCES Sessions(session_id),
    FOREIGN KEY(metric_vector_id) REFERENCES Metric_Vector(metric_id)
);

CREATE TABLE IF NOT EXISTS Cnn_training_data (
    id_cnn              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER,
    exercise_id         INTEGER,
    history_snapshot    TEXT DEFAULT '[]',
    exercise_difficulty INTEGER DEFAULT 1,
    exercise_skills     TEXT DEFAULT '[]',
    improvement_delta   REAL DEFAULT 0,
    timestamp           TIMESTAMP,
    session_id          INTEGER,
    FOREIGN KEY(user_id)     REFERENCES Users(user_id),
    FOREIGN KEY(exercise_id) REFERENCES Exercises(exercise_id),
    FOREIGN KEY(session_id)  REFERENCES Sessions(session_id)
);
