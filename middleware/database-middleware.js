const { MongoClient } = require('mongodb')

const DB_NAME = 'trans-reqrw1016';

const databaseMiddleware = async () => {
    try {
        const mongoClient = await new MongoClient('mongodb://127.0.0.1:27017').connect()
        db = mongoClient.db(DB_NAME)

        const usersCollection = db.collection('users');
        const transCollection = db.collection('users');  

    return { db, usersCollection, transCollection };
    } catch (error) {
        console.log(error, "<=================== error ==================");
        throw new Error("Database connection error");
    }
}

module.exports = databaseMiddleware