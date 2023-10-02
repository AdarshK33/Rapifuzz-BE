const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
let Validator = require('validatorjs');
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require('bcryptjs')
const User = require("../models/user.model");
const Client = require("../models/client.model");
const Project = require("../models/project.model");
const Task = require("../models/task.model");
const DBValidation = require("../models/db_validation");
const sendMail = require("../utils/sendMail");
const getEmails = require("../utils/inboxMail");
const path =  require("path")

// Retrieve all DCs from the database (with condition).
exports.getInfo = catchAsyncErrors(async (req,res, next)=>{
  
  let data = {}
  if(req.user.role === 'admin'){
    const total_projects = await Project.getAllForAdmin()
    const total_projects_count = total_projects ? total_projects.length : 0

    const total_clients = await Client.getClientsbyAdmin()
    const total_clients_count = total_clients ? total_clients.length : 0

    const total_pending_projects = total_projects.filter(e => e.project_status !== "completed")
    const total_pending_projects_count = total_pending_projects.length


    const today = new Date();
    let comming_date = new Date(today.setDate(today.getDate() + today.getDay() + 6));
    //comming_date = comming_date.toISOString().split('T')[0]

    const total_deadline_projects = total_projects.filter(e => {
      let project_end_date = new Date(e.project_end_date)
      if(e.project_status !== "completed" && project_end_date <= comming_date){
        return e
      }
    })
    const total_deadline_projects_count = total_deadline_projects.length

    const total_users = await User.getUsersbyAdmin()
    const total_tasks = await Task.getTasksbyAdmin()
    const proj_info = total_projects.map(proj =>{
      let users_ids = proj.project_user_ids
      users_ids = users_ids.toString().split(',')
      const tasks_fetch = total_tasks.filter(task => task.project_id === proj.project_id)
      let resource_info = {}
      users_ids = [...users_ids, proj.project_manager_id]
      let users_tasks = users_ids.map(usr => {
        const tasks_completed = tasks_fetch.filter(tsk => tsk.user_id === usr && tsk.task_status === "completed")
        const tasks_pending = tasks_fetch.filter(tsk => tsk.user_id === usr && tsk.task_status !== "completed")
        let user_info = total_users.filter(user => usr === user.user_id)
        user_info = user_info.length ? user_info[0].name : ""
        resource_info = {
          name: user_info,
          tasks_completed: tasks_completed.length,
          tasks_pending: tasks_pending.length
        }
        return resource_info
      })
      let proj_info = {
        project_name: proj.project_name,
        manager_name: proj.manager.user_name,
        users_tasks : users_tasks
      }
      return proj_info
    })




    // let clients_projects = total_projects.reduce((t, cv, i, arr) => {
    //   t[cv.clients.client_name] = cv.clients.client_name in t ? [...t[cv.clients.client_name], cv] : [cv];
    //   //t[cv.project_status] = [...t[cv.project_status], cv];
    //    return t;
    // }, {})

    let clients_projects = total_projects.reduce((t, cv, i, arr) => {
      let tempIndex = null;
      let checkIndex = t.map((e, ind) => {
        if(e.client_id === cv.project_client_id){
          tempIndex = ind
        }
        return e
      })
      if(tempIndex !== null){
        let projVal = [cv, ...t[tempIndex].projects]
        t[tempIndex] = { ...t[tempIndex], projects_count: projVal.length, projects: projVal}
      }else{
        console.log(tempIndex);
        t = [...t, {client_id: cv.project_client_id, client_name: cv.clients.client_name, projects_count: 1, projects: [cv]}]
      }
      return t
    }, [])

    data = {
      "TotalProjects": total_projects_count,
      "TotalClients": total_clients_count,
      "PendingProjects": total_pending_projects_count,
      "DeadlineProjects" : total_deadline_projects_count,
      "TempClientsProjects" : clients_projects,
      "ClientsProjects" : total_projects,
      "ProjectInfo" : proj_info
    }
  }else if(req.user.role === 'manager'){
    const total_projects = await Project.getAllForManager(req.user.user_id)
    const total_projects_count = total_projects ? total_projects.length : 0

    const total_manager_tasks = await Task.getTaskbyManagerId(req.user.user_id)
    const total_manager_tasks_count = total_manager_tasks ? total_manager_tasks.length : 0

    const total_pending_projects = total_projects.filter(e => e.project_status !== "completed")
    const total_pending_projects_count = total_pending_projects.length


    const today = new Date();
    let comming_date = new Date(today.setDate(today.getDate() + today.getDay() + 6));
    //comming_date = comming_date.toISOString().split('T')[0]

    const total_deadline_projects = total_projects.filter(e => {
      let project_end_date = new Date(e.project_end_date)
      if(e.project_status !== "completed" && project_end_date <= comming_date){
        return e
      }
    })
    const total_deadline_projects_count = total_deadline_projects.length

    const total_users = await User.getUsersbyAdmin()

    const proj_info = total_projects.map(proj =>{
      let users_ids = proj.project_user_ids
      users_ids = users_ids.toString().split(',')
      const tasks_fetch = total_manager_tasks.filter(task => task.project_id === proj.project_id)
      let resource_info = {}
      users_ids = [...users_ids, proj.project_manager_id]
      let users_tasks = users_ids.map(usr => {
        const tasks_completed = tasks_fetch.filter(tsk => tsk.user_id === usr && tsk.task_status === "completed")
        const tasks_pending = tasks_fetch.filter(tsk => tsk.user_id === usr && tsk.task_status !== "completed")
        let user_info = total_users.filter(user => usr === user.user_id)
        user_info = user_info.length ? user_info[0].name : ""
        resource_info = {
          name: user_info,
          tasks_completed: tasks_completed.length,
          tasks_pending: tasks_pending.length
        }
        return resource_info
      })
      let project_name1 = proj.project_name ? proj.project_name : ""
      let manager_name1 = proj.manager.user_name ? proj.manager.user_name : ""

      let proj_info = {
        project_name: project_name1,
        manager_name: manager_name1,
        users_tasks : users_tasks
      }
      return proj_info
    })


    const project_ids = total_projects.map(e => e.project_id)
    const getTaskInfobyProjectsIDs = await Task.getTaskInfobyProjectsIDs(project_ids)

    // let projects_tasks = getTaskInfobyProjectsIDs.reduce((t, cv, i, arr) => {
    //   t[cv.projects.project_name] = cv.projects.project_name in t ? [...t[cv.projects.project_name], cv] : [cv];
    //   //t[cv.project_status] = [...t[cv.project_status], cv];
    //    return t;
    // }, {})

    let projects_tasks = getTaskInfobyProjectsIDs.reduce((t, cv, i, arr) => {
      let tempIndex = null;
      let checkIndex = t.map((e, ind) => {
        if(e.project_id === cv.project_id){
          tempIndex = ind
        }
        return e
      })
      if(tempIndex !== null){
        let taskVal = [cv, ...t[tempIndex].tasks]
        t[tempIndex] = { ...t[tempIndex], tasks_count: taskVal.length, tasks: taskVal}
      }else{
        t = [...t, {project_id: cv.project_id, project_name: cv.projects.project_name, tasks_count: 1, tasks: [cv]}]
      }
      return t
    }, [])

    data = {
      "TotalProjects": total_projects_count,
      "TotalTasks": total_manager_tasks_count,
      "PendingProjects": total_pending_projects_count,
      "DeadlineProjects" : total_deadline_projects_count,
      "ProjectTasks" : projects_tasks,
      "ProjectInfo" : proj_info
    }
  }else if(req.user.role === 'user'){
    const total_user_tasks = await Task.getTaskbyUserId(req.user.user_id)
    const total_user_tasks_count = total_user_tasks ? total_user_tasks.length : 0

    
    const total_user_pending_tasks = total_user_tasks.filter(e => e.project_status !== "completed")
    const total_user_pending_tasks_count = total_user_pending_tasks.length

    const total_user_completed_tasks = total_user_tasks.filter(e => e.project_status === "completed")
    const total_user_completed_tasks_count = total_user_completed_tasks.length


    const today = new Date();
    let comming_date = new Date(today.setDate(today.getDate() + today.getDay() + 6));
    //comming_date = comming_date.toISOString().split('T')[0]

    const total_deadline_tasks = total_user_tasks.filter(e => {
      let task_end_date = new Date(e.deadline)
      if(e.task_status !== "completed" && task_end_date <= comming_date){
        return e
      }
    })
    const total_deadline_tasks_count = total_deadline_tasks.length

    const total_users = await User.getUsersbyAdmin()

    const total_projects = await Project.getProjectsInfobyUserId(req.user.user_id)

    const proj_info = total_projects.map(proj =>{
      const tasks_fetch = total_user_tasks.filter(task => task.project_id === proj.project_id)
      let resource_info = {}

      const tasks_completed = tasks_fetch.filter(tsk => tsk.user_id === req.user.user_id && tsk.task_status === "completed")
      const tasks_pending = tasks_fetch.filter(tsk => tsk.user_id === req.user.user_id && tsk.task_status !== "completed")
      let user_info = total_users.filter(user => req.user.user_id === user.user_id)
      user_info = user_info.length ? user_info[0].name : ""
      resource_info = {
        name: user_info,
        tasks_completed: tasks_completed.length,
        tasks_pending: tasks_pending.length
      }

      let project_name1 = proj.project_name ? proj.project_name : ""
      let manager_name1 = proj.manager.user_name ? proj.manager.user_name : ""

      let proj_info = {
        project_name: project_name1,
        manager_name: manager_name1,
        users_tasks : resource_info
      }
      return proj_info
    })


    const project_ids = total_projects.map(e => e.project_id)
    
    const getTaskInfobyProjectsIDs = await Task.getTaskInfoforUserbyProjectsIDs(project_ids, req.user.user_id)


    let projects_tasks = getTaskInfobyProjectsIDs.reduce((t, cv, i, arr) => {
      let tempIndex = null;
      let checkIndex = t.map((e, ind) => {
        if(e.project_id === cv.project_id){
          tempIndex = ind
        }
        return e
      })
      if(tempIndex !== null){
        let taskVal = [cv, ...t[tempIndex].tasks]
        t[tempIndex] = { ...t[tempIndex], tasks_count: taskVal.length, tasks: taskVal}
      }else{
        t = [...t, {project_id: cv.project_id, project_name: cv.projects.project_name, tasks_count: 1, tasks: [cv]}]
      }
      return t
    }, [])

    

    data = {
      "TotalTasks": total_user_tasks_count,
      "CompletedTasks": total_user_completed_tasks_count,
      "PendingTasks": total_user_pending_tasks_count,
      "DeadlineProjects" : total_deadline_tasks_count,
      "ProjectPendingTasks" : projects_tasks,
      "ProjectInfo" : proj_info
    }
  }
  res.status(200).json({
    status: true,
    data : data,
  })
})
