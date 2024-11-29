const express =require("express");
const {
    addLike,
    getLikes,
    deleteLike
} = require("../controllers/like.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");

router.route("/new").post(addLike);
router.route('/like-data/:postid').get(getLikes)
router.route('/like-data/:postid').delete(deleteLike)


module.exports =router;
