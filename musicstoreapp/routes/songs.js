const {ObjectId} = require("mongodb");

module.exports = function(app, songsRepository) {

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    });

    app.get('/shop', function (req, res) {
        let filter = {};
        let options = {sort: { title: 1}};

        // Búsqueda
        if(req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
            filter = {"title": {$regex: ".*" + req.query.search + ".*", $options: "i"}};
        }

        // Paginación
        let page = parseInt(req.query.page) || 1;

        songsRepository.getSongsPg(filter, options, page).then(result => {
            let lastPage = result.totalPages;
            let pages = [];
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            let response = {
                songs: result.songs,
                pages: pages,
                currentPage: page,
                search: req.query.search || ""
            }
            res.render("shop.twig", response);
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al listar las canciones: " + error });
        });
    });

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
                                    .then(() => res.redirect("/publications"))
                                    .catch(error => res.render("error.twig", { mensaje: "Error al subir el audio de la canción" }));
                            } else {
                                res.redirect("/publications");
                            }
                        })
                        .catch(error => res.render("error.twig", { mensaje: "Error al subir la portada de la canción" }));
                } else {
                    res.redirect("/publications");
                }
            } else {
                res.render("error.twig", { mensaje: "Error al insertar canción: " + result.error });
            }
        });
    });

    app.get("/songs", function (req, res) {
        let songs = [
            { "title": "Blank space", "price": "1.2" },
            { "title": "See you again", "price": "1.3" },
            { "title": "Uptown Funk", "price": "1.1" }
        ];
        let response = { seller: 'Tienda de canciones', songs: songs };
        res.render("shop.twig", response);
    });

    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    });

    app.get('/songs/edit/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        songsRepository.findSong(filter, {}).then(song => {
            res.render("songs/edit.twig", {song: song});
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al recuperar la canción: " + error });
        });
    });

    app.get('/publications', function (req, res) {
        let filter = {author: req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publications.twig", {songs: songs});
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al listar las publicaciones del usuario: " + error });
        });
    });

    app.get('/songs/:id', function (req, res) {
        let songId = new ObjectId(req.params.id);
        let user = req.session.user;
        let filter = {_id: songId};
        let options = {};
        songsRepository.findSong(filter, options).then(song => {
            userCanBuySong(user, songId, function (canBuySong) {
                let settings = {
                    url: "https://api.currencyapi.com/v3/latest?apikey=cur_live_A6SsT9Dh4LJJ7926wAJz7vlR8T4PXxmfUzrBr5ch&base_currency=EUR&currencies=USD",
                    method: "get",
                }
                let rest = app.get("rest");
                rest(settings, function (error, response, body) {
                    console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                    let responseObject = JSON.parse(body);
                    let rateUSD = responseObject.data.USD.value;
                    // nuevo campo "usd" redondeado a dos decimales
                    let songValue = song.price / rateUSD
                    song.usd = Math.round(songValue * 100) / 100;
                    res.render("songs/song.twig", {song: song, canBuySong: canBuySong});
                })
            })
        }).catch(error => {
            res.send("Se ha producido un error al buscar la canción " + error)
        });
    })

        app.post('/songs/buy/:id', async function (req, res) {
        let songId = new ObjectId(req.params.id);
        let user = req.session.user;

        if (!user) {
            return res.redirect("/users/login");
        }

        try {
            let song = await songsRepository.findSong({ _id: songId }, {});
            if (!song) return res.render("error.twig", { mensaje: "Error: Canción no encontrada" });

            // Validación 1: El autor no puede comprar su canción
            if (song.author === user) {
                return res.render("error.twig", { mensaje: "Error: No puedes comprar tu propia canción" });
            }

            // Validación 2: Verificamos compra duplicada usando songsRepository
            let filter = { user: user, songId: songId };
            let purchases = await songsRepository.getPurchases(filter, {});
            if (purchases && purchases.length > 0) {
                return res.render("error.twig", { mensaje: "Error: Ya has comprado esta canción anteriormente" });
            }

            // Insertamos compra en songsRepository
            let newPurchase = { user: user, songId: songId };
            await songsRepository.insertPurchase(newPurchase);

            res.redirect("/buy");
        } catch (error) {
            res.render("error.twig", { mensaje: "Se ha producido un error al realizar la compra." });
        }
    });

    app.get('/buy', async function (req, res) {
        if (!req.session.user) {
            return res.redirect("/users/login");
        }
        try {
            // Obtenemos compras del usuario usando songsRepository
            let filter = { user: req.session.user };
            let purchases = await songsRepository.getPurchases(filter, {});
            let purchasedSongIds = purchases.map(p => p.songId);

            // Obtenemos los detalles de las canciones
            let filterSongs = { _id: { $in: purchasedSongIds } };
            let songs = await songsRepository.getSongs(filterSongs, {});

            res.render("buy.twig", { songs: songs });
        } catch (error) {
            res.render("error.twig", { mensaje: "Se ha producido un error al listar las compras: " + error });
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
                    res.render("error.twig", { mensaje: "Error al actualizar la portada o el audio de la canción" });
                } else {
                    res.redirect("/publications");
                }
            });
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al modificar la canción: " + error });
        });
    });

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
        let response = 'id: ' + req.params.id + '<br>' + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });

    app.get('/promo*', function (req, res) {
        res.send('Respuesta al patrón promo*');
    });

    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });
};