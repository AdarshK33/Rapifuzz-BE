const express = require("express");
const {
  loginUser,
  resetPasswordSession,
  newPasswordSet,
  resetPassword,
} = require("../controllers/auth.controller");
const router = express.Router();
const { authorizeRoles } = require("../middlewares/auth");

router.route("/login").post(loginUser);
router.route("/newpassword/:email/:reset_token").get(resetPasswordSession);
router.route("/add-new-password").post(newPasswordSet);
router.route("/reset-password").post(resetPassword);

module.exports =router;
