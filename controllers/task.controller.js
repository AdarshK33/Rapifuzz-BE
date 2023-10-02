const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
let Validator = require('validatorjs');
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require('bcryptjs')
const User = require("../models/user.model");
const Client = require("../models/client.model");
const Project = require("../models/project.model");
const DBValidation = require("../models/db_validation");
const Task = require("../models/task.model");
const { isEmpty } = require("../utils/common");
const { createAppNotification } = require("./appnotification.controller");
const { task_creation_notif } = require("../utils/notifMessageTemplate");
const DailyWork = require("../models/daily_work.model");


// Create and Save a new Vendors
exports.create = catchAsyncErrors(async (req, res, next)=> {
    // Validate request
    if (!req.body) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    let validation = new Validator(req.body,{
      project_id : 'required',
      task_title : 'required',
      start_date_time : ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$'],
      deadline : ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$'],
      user_id: 'required'
    });

   
    let errObj = null
    validation.checkAsync(null, ()=>{
        errObj = validation.errors.all()
        for (const errProp in errObj) {
        return next(new ErrorHandler(errObj[errProp], 400))
        }
    });

  if(!errObj){

    
    //Check Userid is valid
    if(req.body.user_id){
      if(await User.isUsersValidWhileAdding([req.body.user_id]) === false){
        return next(new ErrorHandler('Invalid Users Id', 400))
      }
    }

     //Validation for project
     const project_data = await Project.getProjectbyId(req.body.project_id)
     
     if(!project_data){
      return next(new ErrorHandler(`Invalid project id`, 400))
     }
   
      // const isHisProject = await DBValidation.isHisProject(req.body.project_id, req.user)
      // if(!isHisProject){
      //   return next(new ErrorHandler(`No update permission`, 400))
      // }
     
      if(req.body.start_date_time > req.body.deadline){
        return next(new ErrorHandler(`Invalid start and end date`, 400))
      }
    // Create a Vendor
    const task = new Task({
        project_id: req.body.project_id,
        task_title: req.body.task_title,
        description: req.body.description,
        task_status: "started",
        start_date_time: req.body.start_date_time,
        deadline: req.body.deadline,
        user_id: req.body.user_id,
    });
      if(req.body.user_id){
        const isUserBelogstoProject = await DBValidation.isHeisBelongToProjectWhileAdding(req.body.project_id, req.body.user_id)
        if(!isUserBelogstoProject){
          return next(new ErrorHandler(`User does not belogs to this project`, 400))
        }
      }
      // Save Vendors in the database
     const data = await  Task.create(task)

     if(req.body.user_id){
      if(''+req.body.user_id.split('-')[0] === 'MNGR'){
        await createAppNotification( req.user.user_id, req.user.role, req.body.user_id, 'manager', 'task_creation', task_creation_notif(req.user.name, project_data.project_name))
      }else{
        await createAppNotification( req.user.user_id, req.user.role, req.body.user_id, 'user', 'task_creation', task_creation_notif(req.user.name, project_data.project_name))
      }
     }
    
     res.status(201).json({
       success: true,
       task
     })
  }
  
})

// Retrieve all DCs from the database (with condition).
exports.allStatusWise = catchAsyncErrors(async (req,res, next)=>{
  if(!req.query.project_id){
    return next(new ErrorHandler(`Project id couldn't be empty!`, 400))
  }
  
  const project_id = req.query.project_id
  const project_data = await Project.getProjectbyId(project_id);
  if(!project_data){
    return next(new ErrorHandler(`Invalid project id`, 400))
  }

  
  const task_id = req.query.task_id
  const task_title = req.query.task_title
  const task_status = req.query.task_status
  const start_date_time = req.query.start_date_time
  const deadline = req.query.deadline
  const update_date = req.query.update_date
  const user_id = req.query.user_id
  const searchKey = req.query.searchKey


  let perPage = req.query.per_page
  let pageNumber = req.query.page_number
  perPage = perPage === "all"? "": perPage

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  let final_data = await Task.getAll(project_id, task_id,task_title, task_status, deadline, start_date_time, user_id, perPage, pageNumber, searchKey);
  if(req.user.role === "user"){
    const get_user_tasks = await Task.getTaskbyUserId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.task_id)
      if(len.length > 0) return e
    })
  }else if(req.user.role === "manager"){
    const get_user_tasks = await Task.getTaskbyManagerId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.task_id)
      if(len.length > 0) return e
    })
  }

  if(update_date){
    const get_daily_update = await DailyWork.getDailyUpdate(update_date)
    final_data = final_data.map(e => {
      const daily_filter = get_daily_update.filter(i => i.work_task_id === e.task_id)
      if(daily_filter.length > 0) {
        e.is_today_update = true
        e.daily_update = daily_filter[0]
      }else{
        e.is_today_update = false
        e.daily_update = {}
      }
      return e
    })
  }

  final_data = final_data.reduce((t, cv, i, arr) => {
    //t[cv.task_status] = cv.task_status in t ? [...t[cv.task_status], cv] : [cv];
    t[cv.task_status] = [...t[cv.task_status], cv];
     return t;
  }, {
    started: [],
    pending: [],
    completed: []
  })

  res.status(200).json({
    status: true,
    final_data
  })
})

// Retrieve all DCs from the database (with condition).
exports.all = catchAsyncErrors(async (req,res, next)=>{
  const project_id = req.query.project_id
  const task_id = req.query.task_id
  const task_title = req.query.task_title
  const task_status = req.query.task_status
  const start_date_time = req.query.start_date_time
  const update_date = req.query.update_date
  const deadline = req.query.deadline
  const user_id = req.query.user_id
  const searchKey = req.query.searchKey


  let perPage = req.query.per_page
  let pageNumber = req.query.page_number
  perPage = perPage === "all"? "": perPage

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  let final_data = await Task.getAll(project_id, task_id,task_title, task_status, deadline, start_date_time, user_id, perPage, pageNumber, searchKey);
  
  if(req.user.role === "user"){
    const get_user_tasks = await Task.getTaskbyUserId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.task_id)
      if(len.length > 0) return e
    })
  }else if(req.user.role === "manager"){
    const get_user_tasks = await Task.getTaskbyManagerId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.task_id)
      if(len.length > 0) return e
    })
  }

  if(update_date){
    const get_daily_update = await DailyWork.getDailyUpdate(update_date)
    final_data = final_data.map(e => {
      const daily_filter = get_daily_update.filter(i => i.work_task_id === e.task_id)
      if(daily_filter.length > 0) {
        e.is_today_update = true
        e.daily_update = daily_filter[0]
      }else{
        e.is_today_update = false
        e.daily_update = {}
      }
      return e
    })
  }

  res.status(200).json({
    status: true,
    final_data
  })
})

exports.getTask = catchAsyncErrors(async (req, res, next)=> {

  const task_id = req.params.task_id

  const task_data = await Task.getTaskbyID(task_id);
  if(!task_data){
    return next(new ErrorHandler(`Invalid task id`, 400))
  }

  let isHisTask = await DBValidation.isHisTask(task_id, req.user)
  if(!isHisTask){
    return next(new ErrorHandler("Task not belongs to the user", 400))
  }
  
  res.status(200).json({
    status: true,
    data: task_data
  })
})

exports.update = catchAsyncErrors(async (req, res, next)=> {
 
  const task_id = req.params.task_id
  const task_data = await Task.getTaskbyID(task_id);


  if(!task_data){
    return next(new ErrorHandler(`Invalid task id`, 400))
  }

  if(req.body.start_date_time && req.body.deadline && req.body.deadline < req.body.start_date_time){
    return next(new ErrorHandler(`Start date should not be grator than deadline`, 400))
  }

  if(req.body.start_date_time && !req.body.deadline && task_data.deadline < req.body.start_date_time){
    return next(new ErrorHandler(`Start date should not be grator than deadline`, 400))
  }

  if(!req.body.start_date_time && req.body.deadline && task_data.start_date_time > req.body.deadline){
    return next(new ErrorHandler(`Deadline should not be less than start date`, 400))
  }


  if(req.body.start_date_time && !req.body.completed_date_time && task_data.completed_date_time < req.body.start_date_time){
    return next(new ErrorHandler(`Start date should not be grator than completed date`, 400))
  }

  if(!req.body.start_date_time && req.body.completed_date_time && task_data.start_date_time > req.body.completed_date_time){
    return next(new ErrorHandler(`Completed date should not be less than start date`, 400))
  }


  

  const {project_id, task_title, description, task_status, start_date_time, deadline, user_note, completed_date_time, ...rest} = req.body

  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

  
  let validation = new Validator(req.body,{
    task_status :  [{ 'in': ['started', 'pending', 'completed'] }],
    start_date_time : ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$'],
    deadline : ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$'],
    completed_date_time : ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$']
  });

  let errObj = null
  validation.checkAsync(null, ()=>{
      errObj = validation.errors.all()
      for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
      }
  });

  if(!errObj){

    if(req.body.project_id){
      const project_data = await Project.getProjectbyId(project_id);
      if(!project_data){
        return next(new ErrorHandler(`The entered Project ID is invalid`, 400))
      }
    }

      let isHisTask = await DBValidation.isHisTask(task_id, req.user)
      if(!isHisTask){
        return next(new ErrorHandler("Invalid task", 400))
      }
      const updating_task = {}
      if(req.user.role==="manager" || req.user.role==="admin"){
        if(req.body.task_title){
          updating_task.task_title = req.body.task_title
        }
        if(req.body.description){
          updating_task.description = req.body.description
        }
        if(req.body.task_status){
          updating_task.task_status = req.body.task_status
        }
        if(req.body.start_date_time){
          updating_task.start_date_time = req.body.start_date_time
        }
        if(req.body.deadline){
          updating_task.deadline = req.body.deadline
        }
        if(req.body.completed_date_time){
          updating_task.completed_date_time = req.body.completed_date_time
        }
      }else if(req.user.role==="user"){
        if(req.body.user_note){
          updating_task.user_note = req.body.user_note
        }
        if(req.body.task_status){
          updating_task.task_status = req.body.task_status
        }
        if(req.body.completed_date_time){
          updating_task.completed_date_time = req.body.completed_date_time
        }
      }

      if(isEmpty(updating_task)){
        return next(new ErrorHandler("No updation occur", 400))
      }
     
    const task = await Task.update(updating_task, task_id)

      res.status(201).json({
        success: true,
        task
      })
  }
})

// Delete the client related projects and tasks
exports.deleteTask = catchAsyncErrors(async (req,res, next)=>{
  const task_id = req.params.task_id

  const task_data = await Task.getTaskbyID(task_id);
  if(!task_data){
    return next(new ErrorHandler(`Invalid task id`, 400))
  }

  let isHisTask = await DBValidation.isHisTask(task_id, req.user)
  if(!isHisTask){
    return next(new ErrorHandler("Invalid task", 400))
  }

  await Task.delete(task_id)

  res.status(200).json({
    status: true,
    message: "Task deleted successfully!"
  })
})