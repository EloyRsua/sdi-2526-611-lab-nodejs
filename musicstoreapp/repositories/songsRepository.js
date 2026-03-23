module.exports = {
    dbClient: null,
    app: null,
    // 1. AÑADIMOS LAS VARIABLES QUE FALTABAN
    database: "musicStore",
    collectionName: "songs",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    getSongs: async function (filter,options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const songsCollection = database.collection(this.collectionName);
            const songs = await songsCollection.find(filter,options).toArray();
            return songs;
        } catch (error) {
            throw (error);
        }
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
    },
    findSong: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const songsCollection = database.collection(this.collectionName);
            const song = await songsCollection.findOne(filter, options);
            return song;
        } catch (error) {
            throw (error);
        }
    }
};