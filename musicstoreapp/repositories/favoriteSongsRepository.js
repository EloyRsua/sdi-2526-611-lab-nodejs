const {ObjectId} = require("mongodb");

module.exports = {
    dbClient: null,
    app: null,
    database: "musicStore",
    collectionName: "favorite_songs",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    getFavoriteSongs: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const songs = await favoritesCollection.find(filter, options).toArray();
            return songs;
        } catch (error) {
            throw (error);
        }
    },

    insertFavoriteSong: async function (favoriteSong) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const result = await favoritesCollection.insertOne(favoriteSong);
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    },

    deleteFavoriteSong: async function (filter) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const result = await favoritesCollection.deleteOne(filter);
            return result;
        } catch (error) {
            throw (error);
        }
    }
};