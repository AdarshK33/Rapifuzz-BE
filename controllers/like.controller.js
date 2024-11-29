
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Like = require("../models/like.model");
let Validator = require("validatorjs");


exports.addLike = catchAsyncErrors(async (req, res, next) => {
    const {  postid, userid ,...rest } = req.body;
    const other = Object.keys(rest);
    other.map((e) => {
      return next(
        new ErrorHandler(
          `Please remove unwanted fields ${e} from request body`,
          400
        )
      );
    });
  
    let validation = new Validator(req.body, {
      postid: "required",
      userid:  "required",
    });
  
    let errObj = null;
    validation.checkAsync(null, () => {
      errObj = validation.errors.all();
      for (const errProp in errObj) {
        return next(new ErrorHandler(errObj[errProp], 400));
      }
    });
 
    if (!errObj) {
         
    const likeObj = {
        userid,
        postid,
      };
    const likeCreate = await Like.create(likeObj);
  
    res.status(201).json({
      success: true,
      message: "Post has been Liked.",
      data: likeCreate,
    });
  }
  });
  

  exports.getLikes = catchAsyncErrors(async (req, res, next) => {
  
    const postid = req.params.postid
    const getLike = await Like.getLikeById(postid);

    if(!getLike){
      return next(new ErrorHandler(`The entered post ID is invalid`, 400))
    }
   
    res.status(200).json({
      status: true,
      data: getLike
    })
  });

  exports.deleteLike = catchAsyncErrors(async (req, res, next) => {
    const postid = req.params.postid
    const deleteLike = await Like.Delete(postid);

    if(!deleteLike){
      return next(new ErrorHandler(`The entered post ID is invalid`, 400))
    }
   
    res.status(201).json({
      success: true,
      message: "Like has been Deleted.",
      data: likeDelete,
    });
  
  });
  