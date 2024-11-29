const Comment = require("../models/comment.model"); // Ensure the correct path
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

exports.addComment = catchAsyncErrors(async (req, res, next) => {
  const { desc, postid, userid } = req.body;

  const comment = {
    desc,
    userid,
    postid,
  };

  const commentCreate = await Comment.create(comment);

  res.status(201).json({
    success: true,
    message: "Comment has been added!",
    data: commentCreate,
  });
});


exports.getComment = catchAsyncErrors(async (req, res, next)=> {

    const postid = req.params.postid
  
    const comment_data = await Comment.getCommentById(postid);
    if(!comment_data){
      return next(new ErrorHandler(`The entered user ID is invalid`, 400))
    }
    const cleanedData = comment_data.map((comment) => {
        const { userId, ...rest } = comment; // Destructure and exclude `userId`
        return rest;
      });
    res.status(200).json({
      status: true,
      data: cleanedData
    })
  })
  