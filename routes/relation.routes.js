const express =require("express");
const {
    addRelation,
    getRelation
} = require("../controllers/relation.controller");
const router =express.Router();
// const { authorizeRoles } = require("../middlewares/auth");

router.route("/new").post(addRelation);
router.route('/relation-data/:followedUserId').get(getRelation)
module.exports =router;
