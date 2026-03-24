const {ObjectId} = require("mongodb");
module.exports = function (app, commentsRepository) {
    app.post('/comments/:song_id', function (req, res) {
        if (!req.session.user) {
            res.send("Debes estar identificado para enviar un comentario");
            return;
        }
        let comment = {
            author: req.session.user,
            text: req.body.text,
            song_id: new ObjectId(req.params.song_id)
        };
        commentsRepository.insertComment(comment).then(insertedId => {
            res.redirect("/songs/" + req.params.song_id);
        }).catch(error => {
            res.send("Se ha producido un error al insertar el comentario: " + error);
        });
    });
    app.get('/comments/delete/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        commentsRepository.getComments(filter, {}).then(comments => {
            if (comments.length === 0) {
                res.send("Comentario no encontrado");
                return;
            }
            let comment = comments[0];
            if (comment.author !== req.session.user) {
                res.send("No puedes borrar un comentario que no es tuyo");
                return;
            }
            return commentsRepository.deleteComment(filter).then(result => {
                res.redirect("/songs/" + comment.song_id);
            });
        }).catch(error => {
            res.send("Se ha producido un error al borrar el comentario: " + error);
        });
    });
};