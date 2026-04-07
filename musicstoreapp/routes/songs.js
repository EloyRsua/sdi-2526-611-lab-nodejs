const {ObjectId} = require("mongodb");
module.exports = function(app, songsRepository) {
    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    });
    app.get('/shop', function (req, res) {
        let filter = {};
        let options = {sort: { title: 1}};
        if(req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("shop.twig", {songs: songs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones " + error)
        });
    })
    app.post('/songs/add', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        songsRepository.insertSong(song, function (result) {
            if (result.songId !== null && result.songId !== undefined) {
                if (req.files != null) {
                    let image = req.files.cover;
                    image.mv(app.get("uploadPath") + '/public/covers/' + result.songId + '.png')
                        .then(() => {
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv(app.get("uploadPath") + '/public/audios/' + result.songId + '.mp3')
                                    .then(res.send("Agregada la canción ID: " + result.songId))
                                    .catch(error => res.send("Error al subir el audio de la canción"))
                            } else {
                                res.send("Agregada la canción ID: " + result.songId)
                            }
                        })
                        .catch(error => res.send("Error al subir la portada de la canción"))
                } else {
                    res.send("Agregada la canción ID: " + result.songId)
                }
            } else {
                res.send("Error al insertar canción " + result.error);
            }
        });
    });
    app.get("/songs", function (req, res) {
        let songs = [{
            "title": "Blank space",
            "price": "1.2"
        }, {
            "title": "See you again",
            "price": "1.3"
        }, {
            "title": "Uptown Funk",
            "price": "1.1"
        }];

        let response = {
            seller: 'Tienda de canciones',
            songs: songs
        };
        res.render("shop.twig", response);
    });
    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig")
    });
    app.get('/songs/edit/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        songsRepository.findSong(filter, {}).then(song => {
            res.render("songs/edit.twig", {song: song});
        }).catch(error => {
            res.send("Se ha producido un error al recuperar la canción " + error)
        });
    });
    app.get('/publications', function (req, res) {
        let filter = {author: req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publications.twig", {songs: songs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las publicaciones del usuario: " + error)
        });
    });

    // GET /songs/:id — pasa a la vista si el usuario es autor o ya compró la canción
    app.get('/songs/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let options = {};
        songsRepository.findSong(filter, options).then(song => {
            let commentsRepository = app.get("commentsRepository");
            let commentsFilter = {song_id: new ObjectId(req.params.id)};
            return commentsRepository.getComments(commentsFilter, {}).then(comments => {
                let isAuthor = !!(req.session.user && song.author === req.session.user);

                // Si no hay sesión activa, no puede escuchar ni comprar (redirigir o mostrar sin audio)
                if (!req.session.user) {
                    return res.render("songs/song.twig", {
                        song: song,
                        comments: comments,
                        isAuthor: false,
                        hasPurchased: false,
                        canListen: false
                    });
                }

                // Comprobar si el usuario ya compró la canción
                let purchasesRepository = app.get("purchasesRepository");
                let purchaseFilter = {
                    user: req.session.user,
                    song_id: new ObjectId(req.params.id)
                };
                return purchasesRepository.findPurchase(purchaseFilter, {}).then(purchase => {
                    let hasPurchased = purchase != null;
                    let canListen = isAuthor || hasPurchased;

                    res.render("songs/song.twig", {
                        song: song,
                        comments: comments,
                        isAuthor: isAuthor,
                        hasPurchased: hasPurchased,
                        canListen: canListen
                    });
                });
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar la canción " + error);
        });
    });

    app.post('/songs/buy/:id', async function (req, res) {
        let songId = new ObjectId(req.params.id);
        let user = req.session.user;

        if (!user) {
            return res.redirect("/users/login");
        }

        try {
            let song = await songsRepository.findSong({ _id: songId }, {});
            if (!song) return res.send("Error: Canción no encontrada");

            // Validación 1: El autor no puede comprar su canción
            if (song.author === user) {
                return res.send("Error: No puedes comprar tu propia canción");
            }

            // Validación 2: Verificamos compra duplicada usando songsRepository
            let filter = { user: user, songId: songId };
            let purchases = await songsRepository.getPurchases(filter, {});
            if (purchases && purchases.length > 0) {
                return res.send("Error: Ya has comprado esta canción anteriormente");
            }

            // Insertamos compra en songsRepository
            let newPurchase = { user: user, songId: songId };
            await songsRepository.insertPurchase(newPurchase);

            res.redirect("/buy");
        } catch (error) {
            res.send("Se ha producido un error al realizar la compra.");
        }
    });
    app.post('/songs/edit/:id', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        let songId = req.params.id;
        let filter = {_id: new ObjectId(songId)};
        const options = {upsert: false}
        songsRepository.updateSong(song, filter, options).then(result => {
            step1UpdateCover(req.files, songId, function (result) {
                if (result == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.send("Se ha modificado el registro correctamente");
                }
            });
        }).catch(error => {
            res.send("Se ha producido un error al modificar la canción " + error)
        });
    })
    function step1UpdateCover(files, songId, callback) {
        if (files && files.cover != null) {
            let image = files.cover;
            image.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                if (err) {
                    callback(null);
                } else {
                    step2UpdateAudio(files, songId, callback);
                }
            });
        } else {
            step2UpdateAudio(files, songId, callback);
        }
    };
    function step2UpdateAudio(files, songId, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null);
                } else {
                    callback(true);
                }
            });
        } else {
            callback(true);
        }
    };
    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });
    app.get('/promo*', function (req, res) {
        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });
};