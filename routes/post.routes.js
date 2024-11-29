const express =require("express");
const {
    addPost,
    getPost
} = require("../controllers/post.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");

router.route("/new").post(addPost);
router.route('/post-data/:postid').get(getPost)
module.exports =router;
