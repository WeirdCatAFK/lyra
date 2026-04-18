const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Resolve DB_PATH to an absolute location so the SQLite file lives in a
// predictable spot regardless of where the process was started.
const rawDbPath = process.env.DB_PATH || './database.sqlite';
const DB_PATH = path.isAbsolute(rawDbPath)
    ? rawDbPath
    : path.resolve(__dirname, '..', rawDbPath);

const db = new sqlite3.Database(
    DB_PATH,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error("Error conectando DB:", err.message);
        } else {
            console.log("SQLite conectado en", DB_PATH);
        }
    }
);

const timeout = Number(process.env.DB_TIMEOUT) || 5000;
db.configure("busyTimeout", timeout);

// 🔥 EJECUTAR SCHEMA
const schemaPath = path.join(__dirname, 'schema.sql');

fs.readFile(schemaPath, 'utf8', (err, sql) => {
    if (err) {
        console.error("Error leyendo schema:", err);
        return;
    }

    db.exec(sql, (err) => {
        if (err) {
            console.error("Error ejecutando schema:", err.message);
            return;
        }

        console.log("Tablas creadas correctamente");
        // Migrations: add columns that may be missing from older DBs
        const migrations = [
            "ALTER TABLE Cnn_training_data ADD COLUMN user_id INTEGER REFERENCES Users(user_id)",
            "ALTER TABLE Cnn_training_data ADD COLUMN exercise_difficulty INTEGER DEFAULT 1",
            "ALTER TABLE Cnn_training_data ADD COLUMN exercise_skills TEXT DEFAULT '[]'",
            "ALTER TABLE Users ADD COLUMN learning_objectives TEXT DEFAULT '[]'",
        ];
        let pending = migrations.length;
        for (const sql of migrations) {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.warn("Migration skipped:", err.message);
                }
                if (--pending === 0) {
                    // Seed catalog after migrations finish (idempotent).
                    require('./seed_exercises').seedExercises();
                }
            });
        }
    });
});

module.exports = db;
