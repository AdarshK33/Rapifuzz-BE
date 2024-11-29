const multer = require("multer");
const path = require("path");
const ErrorHandler = require("../utils/errorHandler");

// const imgFilter = (req, file, cb) => {
//   if (
//     file.mimetype.includes("png", "jpg", "jpeg")
//   ) {
//     cb(null, true);
//   } else {
//     //cb("Please upload pdf file.", false);
//     return cb(new ErrorHandler("Please upload image file", 403))
//   }
// };

const imgFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(
      new ErrorHandler("Please upload an image file (PNG, JPG, JPEG)", 403)
    );
  }
};

const __basedir = path.resolve();

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/userpic/");
  },
  filename: (req, file, cb) => {
    cb(null, `${"image-admin"}-${Date.now()}-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: imgFilter });
module.exports = uploadFile;
