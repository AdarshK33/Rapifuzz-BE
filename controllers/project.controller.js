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
const { createAppNotification } = require("./appnotification.controller");
const { project_creation_notif_for_manager, project_creation_notif_for_user, project_completion_notif_for_admin, project_completion_notif_for_manager } = require("../utils/notifMessageTemplate");
const UserProject = require("../models/user_project.model");

// Create and Save a new Vendors
exports.create = catchAsyncErrors(async (req, res, next) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }



  let validation = new Validator(req.body, {
    name: 'required',
    project_client_id: 'required',
    project_start_date: ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
    project_end_date: ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
    status: [{ 'in': ['started', 'pending', 'completed'] }],
    project_type: [{ 'in': ['client-based', 'internal'] }],

    project_user_ids: ['array']
  });

  //Check is client is valid
  if (await DBValidation.isClientIsValid(req.body.project_client_id) === false) {
    return next(new ErrorHandler('Invalid Client Id', 400))
  }

  //Check is managerid is valid
  if (await User.isManagerIsValid(req.body.project_manager_id) === false) {
    return next(new ErrorHandler('Invalid Manager Id', 400))
  }



  let errObj = null
  validation.checkAsync(null, () => {
    errObj = validation.errors.all()
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
    }
  });

  if (!errObj) {

    //User ID filteration
    let userids = []
    if ((req.body.project_user_ids).length > 0) {
      userids = [...new Set(req.body.project_user_ids)];
    }

    // Create a Vendor
    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'started',
      project_start_date: req.body.project_start_date,
      project_end_date: req.body.project_end_date,
      project_manager_id: req.body.project_manager_id,
      project_client_id: req.body.project_client_id,
      project_type: req.body.project_type,
      project_user_ids: userids.toString()
    });

    //Check Userid is valid
    if (userids.length > 0) {
      if (await User.isUsersValid(userids) === false) {
        return next(new ErrorHandler('Invalid Users Id', 400))
      }
    }

    // Save Project in the database
    const data = await Project.create(project)

    const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(project.project_manager_id)

    if (req.body.project_manager_id) {
      await createAppNotification(req.user.user_id, req.user.role, req.body.project_manager_id, 'manager', 'project_creation', project_creation_notif_for_manager(req.user.name, req.body.name))
    }

    if ((req.body.project_user_ids).length > 0) {
      req.body.project_user_ids.map(async e => {
        await createAppNotification(req.user.user_id, req.user.role, e, 'user', 'project_creation', project_creation_notif_for_user(req.user.name, req.body.name))
      })
    }

    res.status(201).json({
      success: true,
      data,
      updateManagerProjectCountIncrement
    })
  }

})

// Retrieve all DCs from the database (with condition).
exports.all = catchAsyncErrors(async (req, res, next) => {
  const project_id = req.query.project_id
  const name = req.query.name
  const status = req.query.status
  const start_date = req.query.start_date
  const end_date = req.query.end_date
  const searchKey = req.query.searchKey
  const project_client_id = req.query.project_client_id
  const progress = req.query.progress

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  perPage = perPage === "all" ? "" : perPage
  if (perPage < 0 || pageNumber < 0) {
    perPage = "";
    pageNumber = "";
  }

  let final_data = await Project.getAll(req.user, project_id, name, status, start_date, end_date, project_client_id, perPage, pageNumber, searchKey)

  if (req.user.role === "manager") {
    const get_manager_project_client = await Project.getProjectsbyManagerId(req.user.user_id)
    final_data = final_data.filter(e => {
      const len = get_manager_project_client.filter(i => i.project_id === e.project_id)
      if (len.length > 0) return e
    })
  }
  if (req.user.role === "user") {
    const get_user_project_client = await Project.getProjectsbyUserId(req.user.user_id)
    final_data = final_data.filter(e => {
      const len = get_user_project_client.filter(i => i.project_id === e.project_id)
      if (len.length > 0) return e
    })
  }

  if (progress) {
    const project_ids = final_data.map(e => e.project_id)
    const tasks_all = await Task.getTaskInfobyProjectsIDs(project_ids)
    final_data = final_data.map(e => {
      let pending = 0
      let completed = 0
      const t = tasks_all.filter(k => {
        if (k.project_id === e.project_id) {
          if (k.task_status !== "completed") {
            pending++;
          } else {
            completed++
          }
          return k
        }
      })
      e.pending_task = pending
      e.completed_task = completed

      return e
    })
  }

  res.status(200).json({
    status: true,
    data: final_data
  })
})


// Retrieve all DCs from the database (with condition).
exports.allStatusWise = catchAsyncErrors(async (req, res, next) => {
  if (!req.query.project_client_id) {
    return next(new ErrorHandler(`Clinet id couldn't be empty!`, 400))
  }

  const client_id = req.query.project_client_id
  const client_data = await Client.getClientbyId(client_id);
  if (!client_data) {
    return next(new ErrorHandler(`Invalid client id`, 400))
  }


  const project_id = req.query.project_id
  const name = req.query.name
  const status = req.query.status
  const start_date = req.query.start_date
  const end_date = req.query.end_date
  const searchKey = req.query.searchKey

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  perPage = perPage === "all" ? "" : perPage
  if (perPage < 0 || pageNumber < 0) {
    perPage = "";
    pageNumber = "";
  }

  let final_data = await Project.getAll(req.user, project_id, name, status, start_date, end_date, client_id, perPage, pageNumber, searchKey)

  if (req.user.role === "manager") {
    const get_manager_project_client = await Project.getProjectsbyManagerId(req.user.user_id)
    final_data = final_data.filter(e => {
      const len = get_manager_project_client.filter(i => i.project_id === e.project_id)
      if (len.length > 0) return e
    })
  }

  final_data = final_data.reduce((t, cv, i, arr) => {
    //t[cv.task_status] = cv.task_status in t ? [...t[cv.task_status], cv] : [cv];
    t[cv.project_status] = [...t[cv.project_status], cv];
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


exports.getProject = catchAsyncErrors(async (req, res, next) => {

  const project_id = req.params.project_id
  const project_data = await Project.getProjectbyId(project_id);


  if (!project_data) {
    return next(new ErrorHandler(`Invalid project id`, 400))
  }

  const isHisProject = await DBValidation.isHisProject(project_id, req.user)
  if (!isHisProject) {
    return next(new ErrorHandler(`Project not belongs to the user`, 400))
  }

  res.status(200).json({
    status: true,
    data: project_data
  })
})


exports.update = catchAsyncErrors(async (req, res, next) => {

  const project_id = req.params.project_id
  const project_data = await Project.getProjectbyId(project_id);


  if (!project_data) {
    return next(new ErrorHandler(`The entered Project ID is invalid`, 400))
  }

  const { project_name, description, completed_date_time, project_status, project_start_date, project_end_date, project_manager_id, project_user_ids, project_client_id, ...rest } = req.body
  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

  if (req.body.project_start_date && req.body.project_end_date && req.body.project_end_date < req.body.project_start_date) {
    return next(new ErrorHandler(`Start date should not be grator than project_end_date`, 400))
  }

  if (req.body.project_start_date && !req.body.project_end_date && project_data.project_end_date < req.body.project_start_date) {
    return next(new ErrorHandler(`Start date should not be grator than project_end_date`, 400))
  }

  if (!req.body.project_start_date && req.body.project_end_date && project_data.project_start_date > req.body.project_end_date) {
    return next(new ErrorHandler(`project_end_date should not be less than start date`, 400))
  }

  //User ID filteration
  const userids = [...new Set(req.body.project_user_ids)];
  let validation = new Validator(req.body, {
    project_start_date: ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
    project_end_date: ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
    completed_date_time: ['date', 'regex:/^((?:([2-9][0-9]{3}-[0-9]{2}-[0-9]{2} ([0-1]?[0-9]|2[0-3])):([0-5][0-9])(:[0-5][0-9])))$'],
    status: [{ 'in': ['started', 'pending', 'completed'] }],
    project_user_ids: ['array']
  });

  if (req.user.role) {
    //Check is client is valid
    if (req.body.project_client_id) {
      if (await Client.isClientIsValid(req.body.project_client_id) === false) {
        return next(new ErrorHandler('Invalid Client Id', 400))
      }
    }

    //Check is managerid is valid
    if (req.body.project_manager_id) {
      if (await User.isManagerIsValid(req.body.project_manager_id) === false) {
        return next(new ErrorHandler('Invalid Manager Id', 400))
      }
    }
  }


  //Check Userid is valid
  if (userids.length > 0) {
    // console.log("userids", userids);
    if (await User.isUsersValid(userids) === false) {
      return next(new ErrorHandler('Invalid Users Id', 400))
    }
  }

  let errObj = null
  validation.checkAsync(null, () => {
    errObj = validation.errors.all()
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
    }
  });

  if (!errObj) {

    const isHisProject = await DBValidation.isHisProject(project_id, req.user)
    if (!isHisProject) {
      return next(new ErrorHandler(`No update permission`, 400))
    }

    let updating_project = {}

    if (req.user.role === "manager") {
      if (req.body.project_status) {
        updating_project.project_status = req.body.project_status
      }
      if (req.body.project_start_date) {
        updating_project.project_start_date = req.body.project_start_date
      }
      if (req.body.project_end_date) {
        updating_project.project_end_date = req.body.project_end_date
      }
      if (req.body.completed_date_time) {
        updating_project.completed_date_time = req.body.completed_date_time
      }
      if (req.body.project_user_ids) {
        updating_project.project_user_ids = userids.toString()
      }
    } else if (req.user.role === "admin") {
      if (req.body.project_name) {
        updating_project.project_name = req.body.project_name
      }
      if (req.body.description) {
        updating_project.project_description = req.body.description
      }
      if (req.body.project_status) {
        updating_project.project_status = req.body.project_status
      }
      if (req.body.project_start_date) {
        updating_project.project_start_date = req.body.project_start_date
      }
      if (req.body.project_end_date) {
        updating_project.project_end_date = req.body.project_end_date
      }
      if (req.body.completed_date_time) {
        updating_project.completed_date_time = req.body.completed_date_time
      }
      if (req.body.project_user_ids) {
        updating_project.project_user_ids = userids.toString()
      }
      if (req.body.project_manager_id) {
        updating_project.project_manager_id = req.body.project_manager_id
      }
      if (req.body.project_client_id) {
        updating_project.project_client_id = req.body.project_client_id
      }
    }


    if (isEmpty(updating_project)) {
      return next(new ErrorHandler("No updation occur", 400))
    }
    const checkSingleUser = await UserProject.isUsersValidByuserId(req.body.user_id)
    const project_old_manager_id = await Project.getProjectManager_ByProject_id(project_id);
    const project = await Project.update(updating_project, project_id)

    // console.log(project_old_manager_id, "hello project_old_manager_id")
    // console.log(req.body.project_manager_id, "hello req.body.project_manager_id")
    // console.log(checkSingleUser, 'hello checkSingleUser:');


    // checkSingleUser  length return false for 0
    if (project_old_manager_id != req.body.project_manager_id && checkSingleUser === false) {
      const user_project_obj = new UserProject({
        project_id: project_id,
        user_id: req.body.project_manager_id,
        status: "Active",

      });

      // console.log("hello 1 single ")
      const data = await UserProject.create(user_project_obj);
      const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, project_id)
      const updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id)
      //active new
      const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(req.body.project_manager_id)
      // const updateActiveStatus = await UserProject.updateActiveStatus(req.body.project_manager_id, project_id)

    }
    else if (project_old_manager_id != req.body.project_manager_id && checkSingleUser >= 1) {
      // console.log("hello 2 multi")
      const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, project_id)
      const updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id)
      //active new
      const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(req.body.project_manager_id)
      const updateActiveStatus = await UserProject.updateActiveStatus(req.body.project_manager_id, project_id)

    }

    //Notification
    if (req.body.status === "completed") {
      if (req.user.role === "manager") {
        const admin_users = await User.getUserbyRole('admin')
        if (admin_users.length > 0) {
          admin_users.map(async e => {
            await createAppNotification(req.user.user_id, req.user.role, e.user_id, 'admin', 'project_completion', project_completion_notif_for_admin(req.user.name, project_data.project_name))
          })
        }
      } else if (req.user.role === "admin") {
        const manager = req.body.project_manager_id ? req.body.project_manager_id : project_data.project_manager_id
        await createAppNotification(req.user.user_id, req.user.role, manager, 'manager', 'project_completion', project_completion_notif_for_manager(req.user.name, project_data.project_name))
      }
    }
    res.status(201).json({
      success: true,
      project
    })
  }
})

// Delete the client related projects and Tasks
exports.deleteProject = catchAsyncErrors(async (req, res, next) => {
  const project_id = req.params.project_id

  const project_data = await Project.getProjectbyId(project_id);
  if (!project_data) {
    return next(new ErrorHandler(`Invalid project id`, 400))
  }

  let isHisTask = await DBValidation.isHisProject(project_id, req.user)
  if (!isHisTask) {
    return next(new ErrorHandler("Invalid project", 400))
  }
  await Project.deleteProjectbyId(project_id)
  await Task.deleteByProjectId(project_id)
  res.status(200).json({
    status: true,
    message: "Project deleted successfully!"
  })
})

// Check for deadlines
exports.checkForProjectDeadlines = catchAsyncErrors(async () => {

  const project_data = await Project.checkForProjectDeadlines();

  return project_data;
})

// Delete the client related projects and Tasks
exports.getAllDeadlines = catchAsyncErrors(async (req, res, next) => {

  const deadlines = await Project.getAllDeadlines(req.user)

  res.status(200).json({
    status: true,
    deadlines
  })
})