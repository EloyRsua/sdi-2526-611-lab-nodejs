const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken'); // Asegúrate de tenerlo instalado: npm install jsonwebtoken

module.exports = function (app, songsRepository, usersRepository) {

    // --- RUTA: LOGIN (AUTENTICACIÓN) ---
    app.post('/api/v1.0/users/login', async function (req, res) {
        try {
            const { email, password } = req.body;

            // Encriptar password para comparar
            const securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(password).digest('hex');

            const filter = {
                email: email,
                password: securePassword
            };

            const user = await usersRepository.findUser(filter, {});

            if (!user) {
                return res.status(401).json({
                    message: "Usuario no autorizado",
                    authenticated: false
                });
            }

            // Generar Token JWT
            // Nota: Usa una clave secreta desde app.get('clave') o una específica para JWT
            const token = jwt.sign(
                { user: user.email, time: Date.now() / 1000 },
                "secreto" // Deberías usar app.get('clave') aquí también
            );

            res.status(200).json({
                message: "usuario autorizado",
                authenticated: true,
                token: token
            });

        } catch (e) {
            res.status(500).json({
                message: "Se ha producido un error al verificar credenciales",
                authenticated: false,
                error: e.message // Útil para depurar
            });
        }
    });

    // --- RUTA: LISTAR CANCIONES ---
    app.get("/api/v1.0/songs", function (req, res) {
        songsRepository.getSongs({}, {}).then(songs => {
            res.status(200).json({ songs: songs });
        }).catch(() => {
            res.status(500).json({ error: "Error al recuperar las canciones." });
        });
    });

    // --- RUTA: OBTENER UNA CANCIÓN ---
    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            songsRepository.findSong({ _id: songId }, {}).then(song => {
                if (!song) {
                    res.status(404).json({ error: "ID inválido o no existe" });
                } else {
                    res.status(200).json({ song: song });
                }
            }).catch(error => {
                res.status(500).json({ error: "Error al recuperar la canción." });
            });
        } catch (error) {
            res.status(500).json({ error: "Formato de ID incorrecto" });
        }
    });

    // --- RUTA: INSERTAR CANCIÓN ---
    app.post('/api/v1.0/songs', function (req, res) {
        try {
            // Importante: El autor debería venir del token decodificado, no de la sesión
            // si estás usando una API puramente Stateless (JWT).
            let song = {
                title: req.body.title,
                kind: req.body.kind,
                price: req.body.price,
                author: req.session.user // Asegúrate de que el middleware de sesión esté activo
            };

            songsRepository.insertSong(song, function (songId) {
                if (!songId) {
                    res.status(409).json({ error: "No se ha podido crear la canción." });
                } else {
                    res.status(201).json({
                        message: "Canción añadida correctamente.",
                        _id: songId
                    });
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Error al crear la canción: " + error.message });
        }
    });

    // --- RUTA: BORRAR CANCIÓN ---
    app.delete('/api/v1.0/songs/:id', function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            songsRepository.deleteSong({ _id: songId }, {}).then(result => {
                if (!result || result.deletedCount === 0) {
                    res.status(404).json({ error: "ID no encontrado, nada que borrar." });
                } else {
                    res.status(200).json(result);
                }
            }).catch(error => {
                res.status(500).json({ error: error.message });
            });
        } catch (error) {
            res.status(500).json({ error: "ID mal formado" });
        }
    });

    // --- RUTA: ACTUALIZAR CANCIÓN ---
    app.put('/api/v1.0/songs/:id', function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            let filter = { _id: songId };
            const options = { upsert: false };

            let song = {};
            if (req.body.title) song.title = req.body.title;
            if (req.body.kind) song.kind = req.body.kind;
            if (req.body.price) song.price = req.body.price;

            songsRepository.updateSong(song, filter, options).then(result => {
                if (!result || result.matchedCount === 0) {
                    res.status(404).json({ error: "Canción no encontrada." });
                } else if (result.modifiedCount === 0) {
                    res.status(409).json({ error: "No se realizaron cambios." });
                } else {
                    res.status(200).json({ message: "Modificada correctamente.", result });
                }
            }).catch(error => {
                res.status(500).json({ error: "Error al modificar: " + error.message });
            });
        } catch (error) {
            res.status(500).json({ error: "Error al intentar modificar: " + error.message });
        }
    });
};