const express =require("express");
const {
    addStory,
    getStory
} = require("../controllers/story.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");
const uploadUserPic = require('../middlewares/uploadUserPic')
router.route("/new/:userid").post(uploadUserPic.single("profile_pic_file"),addStory);
router.route('/story-data/:userid').get(getStory)
module.exports =router;
