const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
let Validator = require('validatorjs');
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require('bcryptjs')
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const DBValidation = require("../models/db_validation");
const { isEmpty, updateObj } = require("../utils/common");
const Task = require("../models/task.model");
const APPNotification = require("../models/appnotification.model");


// Create and Save a new Vendors
exports.createAppNotification = async (from_id, from_role, to_id, to_role, notif_type, message, action)=> {
   
    // Create a Vendor
    const notification = new APPNotification({
        from_id: from_id,
        from_role: from_role,
        to_id: to_id,
        to_role: to_role,
        notif_type: notif_type,
        message: message,
        action: action
    });

      // Save Project in the database
     const notif_data = await APPNotification.create(notification)
    
     return {
       success: true,
       data: notif_data
     }
}

// Retrieve all DCs from the database (with condition).
exports.all = catchAsyncErrors(async (req,res, next)=>{
  const notif_id = req.query.notif_id
  const from_id = req.query.from_id
  const to_id = req.user.user_id
  const from_role = req.query.from_role
  const to_role = req.user.role
  const notif_type = req.query.notif_type
  const message = req.query.message
  const action = req.query.action
  const searchKey = req.query.searchKey

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number
  perPage = perPage === "all"? "": perPage

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  let final_data = await APPNotification.getAll(process.env.HOST_URL, notif_id, from_id,to_id,from_role,to_role,notif_type, message, action, perPage, pageNumber, searchKey)

  res.status(200).json({
    status: true,
    data : final_data
  })
})

// Retrieve all DCs from the database (with condition).
exports.allTypeWise = catchAsyncErrors(async (req,res, next)=>{
  

  let final_data = await APPNotification.allTypeWise(req.user.user_id, process.env.HOST_URL)

  final_data = final_data.reduce((t, cv, i, arr) => {
    t[cv.notif_type] = cv.notif_type in t ? [...t[cv.notif_type], cv] : [cv];
    //t[cv.project_status] = [...t[cv.project_status], cv];
     return t;
  }, {})

  res.status(200).json({
    status: true,
    data : final_data
  })
})

exports.update = catchAsyncErrors(async (req, res, next)=> {
 
  const notif_id = req.params.notif_id
  const notif_data = await APPNotification.getNotifbyId(notif_id);


  if(!notif_data){
    return next(new ErrorHandler(`Invalid notifiaction id`, 400))
  }

  const {action, ...rest} = req.body
  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

   //User ID filteration
   const userids = [...new Set(req.body.project_user_ids)];
  let validation = new Validator(req.body,{
    action :  ['required', { 'in': ['seen', 'deleted', 'clicked'] }],
  });

  let errObj = null
  validation.checkAsync(null, ()=>{
      errObj = validation.errors.all()
      for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
      }
  });

  if(!errObj){
    const isHisNotification = await DBValidation.isHisNotification(notif_id, req.user)
      if(!isHisNotification){
        return next(new ErrorHandler(`Invalid notification id`, 400))
      }


      const notification = await APPNotification.update(req.body.action, notif_id)

      res.status(201).json({
        success: true,
        notification
      })
  }
})

exports.seenNotification = catchAsyncErrors(async (req, res, next)=> {
  
    await APPNotification.seenNotification(req.user.user_id)

    res.status(201).json({
      success: true,
      action: true
    })

})

// Check for deadlines
exports.checkActiveNotification = catchAsyncErrors(async (req,res,next)=>{
  
  const available = await APPNotification.checkActiveNotification(req.user.user_id)

  res.status(200).json({
    status: true,
    active_notification: available
  })
})

// Check for deadlines
exports.checkForProjectDeadlines = catchAsyncErrors(async ()=>{
  
  const project_data = await Project.checkForProjectDeadlines();

  return project_data;
})

// Delete the client related projects and Tasks
exports.getAllDeadlines = catchAsyncErrors(async (req,res, next)=>{
  
  const deadlines = await Project.getAllDeadlines(req.user)

  res.status(200).json({
    status: true,
    deadlines
  })
})