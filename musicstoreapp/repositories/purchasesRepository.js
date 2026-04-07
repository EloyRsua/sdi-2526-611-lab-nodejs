const { ObjectId } = require("mongodb");

module.exports = {
    dbClient: null,
    app: null,
    database: "musicStore",
    collectionName: "purchases",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    getPurchases: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const purchasesCollection = database.collection(this.collectionName);
            const purchases = await purchasesCollection.find(filter, options).toArray();
            return purchases;
        } catch (error) {
            throw (error);
        }
    },

    findPurchase: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const purchasesCollection = database.collection(this.collectionName);
            const purchase = await purchasesCollection.findOne(filter, options);
            return purchase;
        } catch (error) {
            throw (error);
        }
    },

    insertPurchase: async function (purchase) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const purchasesCollection = database.collection(this.collectionName);
            const result = await purchasesCollection.insertOne(purchase);
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    }
};