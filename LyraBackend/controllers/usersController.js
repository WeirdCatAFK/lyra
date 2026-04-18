const db = require('../db/connection');
const bcrypt = require('bcrypt');
const config = require('../config');


exports.getUsers = (req, res) => {
    db.all("SELECT user_id, username, email, created_at FROM Users", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};


exports.getUser = (req, res) => {
    db.get(
        "SELECT user_id, username, email, created_at FROM Users WHERE user_id = ?", [req.params.id],
        (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(row || { message: "Usuario no encontrado" });
        }
    );
};


exports.createUser = async(req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        const hash = await bcrypt.hash(password, config.security.saltRounds);

        db.run(
            "INSERT INTO Users (username, email, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))", [username, email, hash],
            function(err) {
                if (err) {
                    console.error(err.message);

                    // Manejo de email duplicado
                    if (err.message.includes("UNIQUE")) {
                        return res.status(400).json({ error: "El email ya está registrado" });
                    }

                    return res.status(500).json({ error: err.message });
                }

                res.status(201).json({
                    message: "Usuario creado",
                    user_id: this.lastID
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateUser = (req, res) => {
    const { username, email } = req.body;

    db.run(
        "UPDATE Users SET username = ?, email = ? WHERE user_id = ?", [username, email, req.params.id],
        function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Usuario actualizado",
                updated: this.changes
            });
        }
    );
};


exports.deleteUser = (req, res) => {
    db.run(
        "DELETE FROM Users WHERE user_id = ?", [req.params.id],
        function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Usuario eliminado",
                deleted: this.changes
            });
        }
    );
};