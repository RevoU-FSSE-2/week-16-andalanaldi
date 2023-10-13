const postController = require("../controller/postcontroller");
const permission = require("../permission");
const { Router } = require("express");
const router = Router();

router.post("",permission.is_authenticated, postController.createPost);
router.get("",permission.is_authenticated, postController.getPosts);

module.exports = router;