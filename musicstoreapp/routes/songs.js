const {ObjectId} = require("mongodb");
module.exports = function(app,songsRepository) {
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
            price: req.body.price
        }
        songsRepository.insertSong(song, function (result) {
            if (result.songId !== null && result.songId !== undefined) {
                //res.send("Agregada la canción ID: " + result.songId);
                if (req.files != null) {
                    let image = req.files.cover;
                    image.mv(app.get("uploadPath") + '/public/covers/' + result.songId + '.png')
                        .then(() => {
                        //res.send("Agregada la canción ID: " + result.songId))
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv(app.get("uploadPath") + '/public/audios/' + result.songId + '.mp3')
                                    .then(res.send("Agregada la canción ID: " + result.songId))
                                    .catch(error => res.send("Error al subir el audio de la canción"))
                            }else {
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
    app.get("/songs/add",function (req,res){
        res.render("songs/add.twig");
    });
    app.get('/songs/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let options = {};
        songsRepository.findSong(filter, options).then(song => {
            res.render("songs/song.twig", {song: song});
        }).catch(error => {
            res.send("Se ha producido un error al buscar la canción " + error)
        });
    })
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