const express =require("express");
const {
  add,
  all,
  deleteUser,
  changeUserPic,
  getUserProfile,
  update,
  updateByAdmin,
  logoutUser,
  getUser,
} = require("../controllers/user.controller");
const router =express.Router();
const { authorizeRoles } = require("../middlewares/auth");

const uploadUserPic = require("../middlewares/uploadUserPic");

router.route("/new").post(add);

router.route("/delete/:user_id").delete(authorizeRoles("admin"), deleteUser);
router
  .route("/change-profile-pic")
  .post(
    authorizeRoles("admin", "manager", "user"),
    uploadUserPic.single("profile_pic_file"),
    changeUserPic
  );
router
  .route("/myprofile")
  .get(authorizeRoles("admin", "manager", "user"), getUserProfile);
router.route("/update").put(authorizeRoles("admin", "manager", "user"), update);
router.route("/update/:user_id").put(authorizeRoles("admin"), updateByAdmin);
router.route("/user-data/:user_id").get(authorizeRoles("admin"), getUser);

router.route("/logout").get(logoutUser);

module.exports =router;
