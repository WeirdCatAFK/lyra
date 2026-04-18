const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');


const SALT_ROUNDS = config.security.saltRounds;

// REGISTER
exports.register = async(req, res) => {
    const { username, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const { learning_objectives = [] } = req.body;

        db.run(
            "INSERT INTO Users (username, email, password_hash, learning_objectives, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
            [username, email, hash, JSON.stringify(learning_objectives)],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });

                const token = jwt.sign({ user_id: this.lastID },
                    config.jwt.secret, { expiresIn: config.jwt.expires }
                );

                res.json({
                    user_id: this.lastID,
                    token
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.get(
        "SELECT * FROM Users WHERE email = ?", [email],
        async(err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            const token = jwt.sign({ user_id: user.user_id },
                config.jwt.secret, { expiresIn: config.jwt.expires }
            );

            res.json({
                message: "Login exitoso",
                user_id: user.user_id,
                token
            });
        }
    );
};