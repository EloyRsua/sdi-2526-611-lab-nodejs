module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "songs",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    insertSong: function (song, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const songsCollection = database.collection(this.collectionName);
                songsCollection.insertOne(song)
                    .then(result => callbackFunction({songId: result.insertedId}))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    }
};