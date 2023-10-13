const { Post } = require("../models/PostMongo");

exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    const post = await Post.create({ title, content });
    post.author = req.user;
    await post.save();
    res.status(201).json(post);
}

exports.getPosts = async (req, res) => {
    let query = { author: req.user };
    if (req.user.is_superuser()) {
        query = {};
    }
    const posts = await Post.find(query).populate("author");
    res.status(200).json(posts);
}