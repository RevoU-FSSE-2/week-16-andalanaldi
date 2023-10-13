const express = require('express');
const app = express();
const applyMiddleware = require('./middleware');
const User = require('./models/User');
const { attachPerm, detachPerm } = require('./models/permissions_utils');
const { PermissionMongo } = require('./models/UserMongo');
const postrouter = require('./route/post');
const controller = require('./controller/usercontroller');
const permissons = require('./permission');
const mongoose = require("mongoose");
const { loginLimiter } = require('./middleware/ratelimit')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL).then(() => console.log("Successfully connect to MongoDB."))
    .catch(err => console.error("Connection error", err));

applyMiddleware(app);



app.get('/', (req, res) => {
    console.log(req.cookies, "COOKIES");
    console.log(req.user , "<============= USER");
    res.send('Hello World!');
});
app.use("/post", postrouter);
app.post("/requestreset", controller.passwordResetRequest);
app.post("/reset", controller.passwordReset);
app.post("/detachperm", async (req, res) => {
    const { username, permission } = req.body;
    const perm = await PermissionMongo.findOne({ name: permission });
    const user = await User.get({ username });
    await detachPerm(user, perm);
    res.json({ message: "success" });
});
app.post("/attachperm", async (req, res) => {
    const { username, permission } = req.body;
    const perm = await PermissionMongo.findOne({ name: permission });
    const user = await User.get({ username });
    await attachPerm(user, perm);
    res.json({ message: "success" });
});
app.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    const user = await User.parseTokenSafe(refreshToken);
    if (!user) return res.status(401).json({ message: "Invalid token" });
    const responseToken = User.generateToken(user);
    res.json(responseToken);
});
app.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const user = await User.get({ username });
    const is_authenticated = await User.authenticate(username, password);
    if (!user || !is_authenticated) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
    }
    const responseToken = User.generateToken(user);
    res.json(responseToken);
});
// session login

app.post("/login_session", controller.login_session);
app.post("/logout_session", controller.logout_session);







// create a user
app.post('/user', async (req, res) => {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    const userPerm = await PermissionMongo.findOne({ name: "user" });
    await attachPerm(user, userPerm);
    const responseToken = User.generateToken(user);
    res.status(201).json(responseToken);
});
// get user info
app.get("/user", permissons.is_authenticated, async (req, res) => {
    const user = req.user;
    res.json(user);
});
// get protected admin user
app.get("/adminuser", permissons.is_superuser, async (req, res) => {
    const user = req.user;
    res.json(user);
});

const server = app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});
module.exports = server;