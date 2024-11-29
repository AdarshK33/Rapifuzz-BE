const Post = require("../models/post.model"); // Ensure the correct path
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
let Validator = require("validatorjs");

exports.addPost = catchAsyncErrors(async (req, res, next) => {
  const { desc, userid ,...rest } = req.body;
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
    desc: "required",
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
    const comment = {
      desc,
      userid,
    };
  const postCreate = await Post.create(comment);

  res.status(201).json({
    success: true,
    message: "Post has been added!",
    data: postCreate,
  });
}
});


exports.getPost = catchAsyncErrors(async (req, res, next)=> {

    const userid = req.params.userid
  
    const post_data = await Post.getPostById(userid);
    if(!post_data){
      return next(new ErrorHandler(`The entered post ID is invalid`, 400))
    }
   
    res.status(200).json({
      status: true,
      data: post_data
    })
  })
  