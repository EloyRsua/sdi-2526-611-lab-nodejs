const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken'); // Asegúrate de tenerlo instalado: npm install jsonwebtoken

// Función de validación de canción
function validateSong(body) {
    const errors = [];
    const { title, kind, price } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        errors.push("El título es obligatorio y debe tener al menos 3 caracteres.");
    }
    if (title && title.trim().length > 100) {
        errors.push("El título no puede superar los 100 caracteres.");
    }

    const validKinds = ['pop', 'folk', 'rock', 'reagge', 'rap', 'latino', 'blues', 'otros'];
    if (!kind || !validKinds.includes(kind.toLowerCase())) {
        errors.push("El género es obligatorio y debe ser uno de: " + validKinds.join(', '));
    }

    const parsedPrice = parseFloat(price);
    if (price === undefined || price === null || price === '') {
        errors.push("El precio es obligatorio.");
    } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push("El precio debe ser un número positivo mayor que 0.");
    } else if (parsedPrice > 9999) {
        errors.push("El precio no puede superar 9999€.");
    }

    return errors;
}



module.exports = function (app, songsRepository, usersRepository) {

    // --- RUTA: LOGIN (AUTENTICACIÓN) ---
    app.post('/api/v1.0/users/login', async function (req, res) {
        try {
            const { email, password } = req.body;
            const securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(password).digest('hex');
            const user = await usersRepository.findUser({ email, password: securePassword }, {});
            if (!user) {
                return res.status(401).json({ message: "Usuario no autorizado", authenticated: false });
            }
            const token = jwt.sign(
                { user: user.email, time: Date.now() / 1000 },
                "secreto"
            );
            res.status(200).json({ message: "usuario autorizado", authenticated: true, token });
        } catch (e) {
            res.status(500).json({ message: "Error al verificar credenciales", authenticated: false });
        }
    });


    // --- RUTA: LISTAR CANCIONES ---
    /**
     * @swagger
     * /api/v1.0/songs:
     *   get:
     *     summary: Obtener lista de canciones
     *     description: Retorna todas las canciones almacenadas en el sistema. Puede filtrarse opcionalmente por texto de búsqueda.
     *     tags:
     *       - Songs
     *     responses:
     *       200:
     *         description: Lista de canciones obtenida correctamente.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 songs:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Song'
     *       500:
     *         description: Error interno del servidor al recuperar las canciones.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Se ha producido un error al recuperar las canciones.
     */
    app.get("/api/v1.0/songs", function (req, res) {
        songsRepository.getSongs({}, {}).then(songs => {
            res.status(200).json({ songs });
        }).catch(() => {
            res.status(500).json({ error: "Error al recuperar las canciones." });
        });
    });


    // --- RUTA: OBTENER UNA CANCIÓN ---
    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            songsRepository.findSong({ _id: songId }, {}).then(song => {
                if (!song) res.status(404).json({ error: "Canción no encontrada" });
                else res.status(200).json({ song });
            }).catch(() => res.status(500).json({ error: "Error al recuperar la canción." }));
        } catch (e) {
            res.status(400).json({ error: "Formato de ID incorrecto" });
        }
    });


    // --- RUTA: INSERTAR CANCIÓN ---
    /**
     * @swagger
     * /api/v1.0/songs:
     *   post:
     *     summary: Crear una nueva canción
     *     description: Añade una nueva canción al sistema.
     *     tags:
     *       - Songs
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SongRequest'
     *     responses:
     *       201:
     *         description: Canción creada correctamente.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Canción añadida correctamente.
     *                 _id:
     *                   type: string
     *       409:
     *         description: Conflicto, la canción ya existe.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: No se ha podido crear la canción. El recurso ya existe.
     *       500:
     *         description: Error interno del servidor.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    app.post('/api/v1.0/songs', function (req, res) {
        const errors = validateSong(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        let song = {
            title: req.body.title.trim(),
            kind: req.body.kind.toLowerCase(),
            price: parseFloat(req.body.price),
            author: req.session.user
        };

        songsRepository.insertSong(song, function (songId) {
            if (!songId) {
                res.status(409).json({ error: "No se ha podido crear la canción." });
            } else {
                res.status(201).json({ message: "Canción añadida correctamente.", _id: songId });
            }
        });
    });

    // --- RUTA: BORRAR CANCIÓN ---
    /**
     * @swagger
     * /api/v1.0/songs/{id}:
     *   delete:
     *     summary: Eliminar una canción
     *     description: Elimina una canción del sistema a partir de su identificador.
     *     tags:
     *       - Songs
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Identificador único de la canción.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Canción eliminada correctamente.
     *       404:
     *         description: ID inválido o canción no encontrada.
     *       500:
     *         description: Error interno del servidor.
     */
    app.delete('/api/v1.0/songs/:id', async function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);

            // Comprobar que el usuario es el dueño
            const song = await songsRepository.findSong({ _id: songId }, {});
            if (!song) {
                return res.status(404).json({ error: "Canción no encontrada." });
            }
            if (song.author !== req.session.user) {
                return res.status(403).json({ error: "No tienes permiso para eliminar esta canción." });
            }

            const result = await songsRepository.deleteSong({ _id: songId }, {});
            if (!result || result.deletedCount === 0) {
                res.status(404).json({ error: "Nada que borrar." });
            } else {
                res.status(200).json(result);
            }
        } catch (e) {
            res.status(400).json({ error: "ID mal formado" });
        }
    });


    // --- RUTA: ACTUALIZAR CANCIÓN ---
    /**
     * @swagger
     * /api/v1.0/songs/{id}:
     *   put:
     *     summary: Modificar una canción
     *     description: Actualiza los datos de una canción existente mediante su identificador.
     *     tags:
     *       - Songs
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Identificador único de la canción.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SongRequest'
     *     responses:
     *       200:
     *         description: Canción modificada correctamente.
     *       404:
     *         description: ID inválido o canción no encontrada.
     *       409:
     *         description: No se ha realizado ninguna modificación.
     *       500:
     *         description: Error interno del servidor.
     */
    app.put('/api/v1.0/songs/:id', async function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);

            // Comprobar que el usuario es el dueño
            const existing = await songsRepository.findSong({ _id: songId }, {});
            if (!existing) {
                return res.status(404).json({ error: "Canción no encontrada." });
            }
            if (existing.author !== req.session.user) {
                return res.status(403).json({ error: "No tienes permiso para modificar esta canción." });
            }

            // Validar campos
            const errors = validateSong(req.body);
            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            let song = {
                title: req.body.title.trim(),
                kind: req.body.kind.toLowerCase(),
                price: parseFloat(req.body.price)
            };

            const result = await songsRepository.updateSong(song, { _id: songId }, { upsert: false });
            if (!result || result.matchedCount === 0) {
                res.status(404).json({ error: "Canción no encontrada." });
            } else if (result.modifiedCount === 0) {
                res.status(409).json({ error: "No se realizaron cambios." });
            } else {
                res.status(200).json({ message: "Modificada correctamente.", result });
            }
        } catch (e) {
            res.status(400).json({ error: "Error: " + e.message });
        }
    });
};