const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");
exports.Post = model("Post", new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}));