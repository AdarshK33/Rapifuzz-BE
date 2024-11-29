const Story = require("../models/story.model"); // Ensure the correct path
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
let Validator = require("validatorjs");

exports.addStory = catchAsyncErrors(async (req, res, next) => {
  const { userid ,...rest } = req.body;
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
    userid: "required",
   
  });

  let errObj = null;
  validation.checkAsync(null, () => {
    errObj = validation.errors.all();
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400));
    }
  });


  if (!errObj) {
    const storyObj = {
        userid,
  
    };
  const storyCreate = await Story.create(storyObj);

  res.status(201).json({
    success: true,
    message: "Story has been added!",
    data: storyCreate,
  });
}
});


exports.getStory= catchAsyncErrors(async (req, res, next)=> {

    const userid = req.params.userid
  
    const userid_data = await Story.getStoryById(userid);

    // console.log("followedUser_data",userid_data)
    if(!userid_data){
      return next(new ErrorHandler(`The entered user ID is invalid`, 400))
    }
   
    res.status(200).json({
      status: true,
      data: userid_data
    })
  })
  