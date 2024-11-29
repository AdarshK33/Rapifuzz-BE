const express =require("express");
const {
    addStory,
    getStory
} = require("../controllers/story.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");

router.route("/new").post(addStory);
router.route('/story-data/:userid').get(getStory)
module.exports =router;
