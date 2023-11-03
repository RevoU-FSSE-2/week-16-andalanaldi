const { MongoClient } = require('mongodb')

const DB_NAME = 'trans-reqrw1016';

const databaseMiddleware = async (req, res, next) => {
    try {
        const mongoClient = await new MongoClient('mongodb://127.0.0.1:27017').connect()
        const db = mongoClient.db(DB_NAME)

        const usersCollection = db.collection('users');
        const transCollection = db.collection('trans'); 
        
        req.db = db;
        req.usersCollection = usersCollection;
        req.transCollection = transCollection;

        next()
    // return { db, usersCollection, transCollection };
    } catch (error) {
        console.log(error, "<=================== error ==================");
        throw new Error("Database connection error");
    }
}

module.exports = databaseMiddleware