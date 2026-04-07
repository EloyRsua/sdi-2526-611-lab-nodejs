const {ObjectId} = require("mongodb");
module.exports = function (app, favoriteSongsRepository) {
    app.get('/songs/favorites', function (req, res) {
        let filter = {user: req.session.user};
        let options = {sort: {date: -1}};
        favoriteSongsRepository.getFavoriteSongs(filter, options).then(songs => {
            let totalPrice = songs.reduce((acc, song) => acc + song.price, 0);
            res.render("songs/favorites.twig", {songs: songs, totalPrice: totalPrice});
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al listar canciones favoritas" + error });
        });
    });
    app.post('/songs/favorites/add/:song_id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.song_id)};
        let songsRepository = app.get("songsRepository");
        songsRepository.findSong(filter, {}).then(song => {
            let favoriteSong = {
                song_id: new ObjectId(req.params.song_id),
                date: new Date(),
                price: parseFloat(song.price),
                title: song.title,
                user: req.session.user
            };
            return favoriteSongsRepository.insertFavoriteSong(favoriteSong);
        }).then(insertedId => {
            res.redirect("/songs/favorites");
        }).catch(error => {
            res.render("error.twig", { mensaje: "Se ha producido un error al añadir la canción a favoritos: " + error});
        });
    });
    app.get('/songs/favorites/delete/:song_id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.song_id), user: req.session.user};
        favoriteSongsRepository.deleteFavoriteSong(filter).then(result => {
            res.redirect("/songs/favorites");
        }).catch(error => {
            res.render("error.twig", { mensaje:"Se ha producido un error al eliminar la canción de favoritos: " + error});
        });
    });
};