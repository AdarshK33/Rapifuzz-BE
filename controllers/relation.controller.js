const Relation = require("../models/relation.model"); // Ensure the correct path
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
let Validator = require("validatorjs");

exports.addRelation = catchAsyncErrors(async (req, res, next) => {
  const { followeruserid, followeduserid ,...rest } = req.body;
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
    followeruserid: "required",
    followeduserid:  "required",
  });

  let errObj = null;
  validation.checkAsync(null, () => {
    errObj = validation.errors.all();
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400));
    }
  });


  if (!errObj) {
    const relationObj = {
      followeruserid,
    followeduserid,
    };
  const relationCreate = await Relation.create(relationObj);

  res.status(201).json({
    success: true,
    message: "Relation has been added!",
    data: relationCreate,
  });
}
});


exports.getRelation = catchAsyncErrors(async (req, res, next)=> {

    const followedUserId = req.params.followedUserId
  
    const followedUser_data = await Relation.getRelationById(followedUserId);

    console.log("followedUser_data",followedUser_data)
    if(!followedUser_data){
      return next(new ErrorHandler(`The entered followed ID is invalid`, 400))
    }
   
    res.status(200).json({
      status: true,
      data: followedUser_data
    })
  })

exports.followFriend = catchAsyncErrors(async (req, res, next) => {
 
  const userid = req.params.userid
    const relationMake = await Relation.findFriend(userid, process.env.HOST_URL);
//  console.log("relationMake",relationMake)
    res.status(200).json({
      success: true,
      message: "Find friend has been searched!",
      data: relationMake,
    });
  
  });