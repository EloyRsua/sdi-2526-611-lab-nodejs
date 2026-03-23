module.exports = {
    mongoClient: null,
    app: null,

    init: function (app, mongoClient) {
        this.mongoClient = mongoClient;
        this.app = app;
    },

    findUser: async function (filter, options) {
        try {
            await this.mongoClient.connect(); // Cambiado a mongoClient
            const database = this.mongoClient.db("musicStore"); // Nombre directo
            const usersCollection = database.collection("users"); // Nombre directo

            const user = await usersCollection.findOne(filter, options);
            return user;
        } catch (error) {
            throw (error);
        }
    },

    insertUser: async function (user) {
        try {
            await this.mongoClient.connect(); // Cambiado a mongoClient
            const database = this.mongoClient.db("musicStore"); // Nombre directo
            const usersCollection = database.collection("users"); // Nombre directo

            const result = await usersCollection.insertOne(user);
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    }
};