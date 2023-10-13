const { PermissionMongo } = require('../models/UserMongo');
const mongoose = require("mongoose");
require('dotenv').config()

const main = async () => {
    mongoose.connect(process.env.MONGO_URL).then(() => console.log("Successfully connect to MongoDB."))
        .catch(err => console.error("Connection error", err));
    const permissions = [
        {
            name: "superuser",
            description: "admin roles",
            permission_type: "role"
        },
        {
            name: "user",
            description: "user roles",
            permission_type: "role"
        },
        {
            name: "staff",
            description: "staff roles",
            permission_type: "role"
        }
    ]
    try {
        for (let perm of permissions) {
            await PermissionMongo.create(perm);
        }

    } catch (e) {
        console.log(e);
    } finally {
        mongoose.connection.close();
    }
};
main();