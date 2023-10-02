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
const DailyWork = require("../models/daily_work.model");
const excel = require('exceljs');




// Create and Save a new Vendors
exports.create = catchAsyncErrors(async (req, res, next)=> {
    // Validate request
    if (!req.body) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    

    let validation = new Validator(req.body,{
      work_task_id : 'required',
      hours_worked : ['required', 'integer', { 'in': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] }],
    });

   
    let errObj = null
    validation.checkAsync(null, ()=>{
        errObj = validation.errors.all()
        for (const errProp in errObj) {
        return next(new ErrorHandler(errObj[errProp], 400))
        }
    });

  if(!errObj){

      
  const task_data = await Task.getTaskbyID(req.body.work_task_id);
  if(!task_data){
    return next(new ErrorHandler(`Invalid task id`, 400))
  }

  let isHisTask = await DBValidation.isHisTask(req.body.work_task_id, req.user)
  if(!isHisTask){
    return next(new ErrorHandler("Task not belongs to the user", 400))
  }

  let user_id = req.user.user_id
  if(req.user.role === "admin" || req.user.role === "manager"){
    user_id = task_data.task_user_id
  }

  // Create a Vendor
  const daily_work = new DailyWork({
    work_task_id: req.body.work_task_id,
    hours_worked: req.body.hours_worked,
    comment: req.body.comment,
    user_id: user_id,
    updated_by: req.user.user_id
});

     const data = await  DailyWork.create(daily_work)
    
     res.status(201).json({
       success: true,
       data
     })
  }
  
})


exports.all = catchAsyncErrors(async (req,res, next)=>{
  const work_id = req.query.work_id
  const work_task_id = req.query.work_task_id
  const hours_worked = req.query.hours_worked
  const comment = req.query.comment
  const user_id = req.query.user_id
  const createdAt = req.query.createdAt
  const searchKey = req.query.searchKey

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number
  perPage = perPage === "all"? "": perPage

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  let final_data = await DailyWork.getAll(work_id, work_task_id, hours_worked,comment, user_id, createdAt, perPage, pageNumber, searchKey);
  if(req.user.role === "user"){
    const get_user_tasks = await Task.getTaskbyUserId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.work_task_id)
      if(len.length > 0) return e
    })
  }else if(req.user.role === "manager"){
    const get_user_tasks = await Task.getTaskbyManagerId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_user_tasks.filter(i => i.task_id===e.work_task_id)
      if(len.length > 0) return e
    })
  }

  res.status(200).json({
    status: true,
    data : final_data
  })
})

exports.downloadExcel = catchAsyncErrors(async (req,res, next)=>{
  const project_id = req.query.project_id;
  const user_id = req.query.user_id;
  const report_type = req.query.report_type;
  const date_from = req.query.date_from;
  const date_to = req.query.date_to;

  let validation = new Validator(req.query,{
    project_id : 'required',
    report_type :  ['required', { 'in': ['daily_report','weekly_report','monthly_report', 'custom_report'] }],
    date_from : ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
    date_to : ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/']
  });

  let errObj = null
  validation.checkAsync(null, ()=>{
      errObj = validation.errors.all()
      for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
      }
  });

  if(!errObj){
    let daily_report = []
    if(project_id === "all"){
      let projects_data = []
      if(req.user.role === "manager"){
        projects_data = await Project.getProjectsbyManagerId(req.user.user_id)
      }else if(req.user.role === "admin"){
        projects_data = await Project.getProjectsbyAdmin()
      }
      const project_ids = projects_data.map(e=> e.project_id)
      daily_report = await DailyWork.getReportAll(project_ids, report_type, date_from, date_to, user_id);
      
      let workbook = new excel.Workbook(); //creating workbook
      
      daily_report = Object.entries(daily_report).map( ([k, v]) => {
          const temp = v.map(e => {
            e.task_title = e.tasks.task_title
            e.task_status = e.tasks.task_status
            e.deadline = e.tasks.deadline
            e.user_name = e.users.user_name
            return e
          })


          let project_name = projects_data.filter(e => e.project_id === k)
          let worksheet = workbook.addWorksheet(`${report_type} - ${project_name[0].project_name}`); //creating worksheet
      
          //  WorkSheet Header
          worksheet.columns = [
            { header:"Assigned To", key: 'user_name', width: 20, style:{bgColor: {argb: 'FF00FF00'}}},
            { header:"Task Title", key: 'task_title', width: 20},
            { header:"Total Hours", key: 'hours_worked', width: 20},
            { header:"user Remarks", key: 'comment', width: 20}, 
            { header:"Task Status", key: 'task_status', width: 20},
            { header:"Task Deadline", key: 'deadline', width: 20},
            { header:"Date", key: 'createdAt', width: 20}, 
          ];
      
          worksheet.addRows(temp);
      
          worksheet.eachRow(function(row, rowNumber){
            let status = ""
            row.eachCell( function(cell, colNumber){
              if(rowNumber === 1){
                row.getCell(colNumber).fill = {
                  type: 'pattern',
                  pattern:'solid',
                  fgColor:{argb:'C7C7C7'}
                };
              }
              if(colNumber === 5 && rowNumber !== 1){
                status = cell.value
              }
              if(colNumber === 6 && rowNumber !== 1){
                  const today = new Date()
                  const deadline = new Date(cell.value)
                  if(today > deadline && status !== "completed"){
                    row.getCell(colNumber).font = {color: {argb: "ff0000"}};
                  }
                }
            });
          });
        return v
      });
      

      if(daily_report.length < 1){
        let worksheet = workbook.addWorksheet(`${report_type} - No Data`); //creating worksheet
        worksheet.columns = [
          { header:"No data Found", key: 'user_name', width: 20, style:{bgColor: {argb: 'FF00FF00'}}},
        ];
        console.log("sssssssssssssssss");
      }
      await workbook.xlsx.writeFile(`./resources/static/assets/download/${report_type}.xlsx`)
      .then(function() {
      });

      res.status(200).download(`./resources/static/assets/download/${report_type}.xlsx`)

    }else if(project_id !== "all"){
      const project_data = await Project.getProjectbyId(project_id);
        if(!project_data){
          return next(new ErrorHandler(`The entered Project ID is invalid`, 400))
        }
    
        const isHisProject = await DBValidation.isHisProject(project_id, req.user)
        if(!isHisProject){
          return next(new ErrorHandler(`Project not belongs to the user`, 400))
        }
    
        daily_report = await DailyWork.getReport(project_id, report_type, date_from, date_to);
    
        //res.json(daily_report)
        daily_report = daily_report.map(e => {
          
          e.task_title = e.tasks.task_title
          e.task_status = e.tasks.task_status
          e.deadline = e.tasks.deadline
          e.user_name = e.users.user_name
          return e
        })
        //res.json(daily_report)
        let workbook = new excel.Workbook(); //creating workbook
        let worksheet = workbook.addWorksheet(`${report_type} - ${project_data.project_name}`); //creating worksheet
    
        //  WorkSheet Header
        worksheet.columns = [
          { header:"Assigned To", key: 'user_name', width: 20},
          { header:"Task Title", key: 'task_title', width: 20},
          { header:"Total Hours", key: 'hours_worked', width: 20},
          // { header:"user Remarks", key: 'comment', width: 20}, 
          { header:"Task Status", key: 'task_status', width: 20},
          // { header:"Task Deadline", key: 'deadline', width: 20},
          // { header:"Date", key: 'createdAt', width: 20}, 
        ];
    
        worksheet.addRows(daily_report);
    
        worksheet.eachRow(function(row, rowNumber){
          let status = ""
          row.eachCell( function(cell, colNumber){
            if(rowNumber === 1){
              row.getCell(colNumber).fill = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{argb:'C7C7C7'}
              };
            }
            if(colNumber === 5 && rowNumber !== 1){
              status = cell.value
            }
            if(colNumber === 6 && rowNumber !== 1){
                const today = new Date()
                const deadline = new Date(cell.value)
                if(today > deadline && status !== "completed"){
                  row.getCell(colNumber).font = {color: {argb: "ff0000"}};
                }
              }
          });
        });
    
        // Write to File
        await workbook.xlsx.writeFile(`./resources/static/assets/download/${report_type}.xlsx`)
        .then(function() {
        });
    
        res.status(200).download(`./resources/static/assets/download/${report_type}.xlsx`)

    }
  }
})

