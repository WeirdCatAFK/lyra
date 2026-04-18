const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database(
    process.env.DB_PATH,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error("❌ Error conectando DB:", err.message);
        } else {
            console.log("✅ SQLite conectado en", process.env.DB_PATH);
        }
    }
);

const timeout = Number(process.env.DB_TIMEOUT) || 5000;
db.configure("busyTimeout", timeout);

// 🔥 EJECUTAR SCHEMA
const schemaPath = path.join(__dirname, 'schema.sql');

fs.readFile(schemaPath, 'utf8', (err, sql) => {
    if (err) {
        console.error("❌ Error leyendo schema:", err);
        return;
    }

    db.exec(sql, (err) => {
        if (err) {
            console.error("❌ Error ejecutando schema:", err.message);
        } else {
            console.log("✅ Tablas creadas correctamente");
        }
    });
});

module.exports = db;