const express =require("express");
const {
  add,
  deleteUser,
  changeUserPic,
  getUserProfile,
  update,
  logoutUser,
  getUser,
} = require("../controllers/user.controller");
const router =express.Router();
const { authorizeRoles } = require("../middlewares/auth");

const uploadUserPic = require("../middlewares/uploadUserPic");

router.route("/new").post(add);


router.route("/delete/:user_id").delete( deleteUser);
router.route("/change-profile-pic/:user_id").post(uploadUserPic.single("profile_pic_file"), changeUserPic);
router.route("/myprofile").get( getUserProfile);
router.route("/update").put(update);
router.route("/user-data/:user_id").get( getUser);

router.route("/logout").get(logoutUser);

module.exports =router;
