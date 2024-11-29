const express =require("express");
const {
    addComment,
    getComment
} = require("../controllers/comment.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");

router.route("/new").post(addComment);
router.route('/comment-data/:postid').get(getComment)
module.exports =router;
