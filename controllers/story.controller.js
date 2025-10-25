const Story = require("../models/story.model"); // Ensure the correct path
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
let Validator = require("validatorjs");

exports.addStory = catchAsyncErrors(async (req, res, next) => {
 
  const userid = req.params.userid;

 
    if (req.file == undefined) {
      return res.status(400).send("Please upload profile pic (Image file only)!");
    }
  
  let uploadedpath = "/resources/static/assets/uploads/userpic/" + req.file.filename;
  const storyCreate = await Story.create(uploadedpath,userid,);



  res.status(201).json({
    success: true,
    message: "Story has been added!",
    path: uploadedpath,
    data: storyCreate,
  });

});


// exports.getStory= catchAsyncErrors(async (req, res, next)=> {

//     const userid = req.params.userid
  
//     const userid_data = await Story.getStoryById(userid,process.env.HOST_URL);

//     // console.log("followedUser_data",userid_data)
//     if(!userid_data){
//       return next(new ErrorHandler(`The entered user ID is invalid`, 400))
//     }
   
//     res.status(200).json({
//       status: true,
//       data: userid_data
//     })
//   })


exports.getStory = catchAsyncErrors(async (req, res, next) => {
  const userid = req.params.userid;

  // Get pagination and search parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  // Fetch paginated stories + total count
  const { stories, total } = await Story.getStoryById(userid, process.env.HOST_URL, {
    page,
    limit,
    search,
  });

  if (!stories || stories.length === 0) {
    return next(new ErrorHandler(`No stories found for the entered user ID`, 404));
  }

  res.status(200).json({
    status: true,
    page,
    limit,
    total, // 👈 total count of all stories
   results: total,     // 👈 instead of stories.length
  data: stories,
  });
});


  