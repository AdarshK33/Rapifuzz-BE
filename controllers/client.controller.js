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


// Create and Save a new Vendors
exports.create = catchAsyncErrors(async (req, res, next)=> {
    // Validate request
    if (!req.body) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    // Create a Vendor
    const client = new Client({
        name: req.body.name,
        address: req.body.address,
        email: req.body.email,
        contact: req.body.contact,
        status: req.body.status || 'In Active'
    });

    let validation = new Validator(req.body,{
      name : 'required',
      email : ['required', 'email'],
      contact : ['required', 'integer', 'digits:10'],
      address: 'required',
      status :  [{ 'in': ['Active', 'In Active'] }]
    });

    const checkEmail = await User.findByEmail(req.body.email)
    if(checkEmail){
      return next(new ErrorHandler("Sorry! given email is already taken", 400))
    }
   
    let errObj = null
    validation.checkAsync(null, ()=>{
        errObj = validation.errors.all()
        for (const errProp in errObj) {
        return next(new ErrorHandler(errObj[errProp], 400))
        }
    });

  if(!errObj){
      // Save Vendors in the database
     const data = await  Client.create(client)
    
     res.status(201).json({
       success: true,
       data
     })
  }
  
})

// Retrieve all DCs from the database (with condition).
exports.all = catchAsyncErrors(async (req,res, next)=>{
  const client_id = req.query.client_id
  const name = req.query.name
  const email = req.query.email
  const contact = req.query.contact
  const status = req.query.status
  const searchKey = req.query.searchKey

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number
  perPage = perPage === "all"? "": perPage

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  let final_data = await Client.getAll(client_id, name,email, contact, status, perPage, pageNumber, searchKey);

  if(req.user.role === "manager"){
    const get_manager_project_client = await Project.getClientProjectsbyManagerId(req.user.user_id) 
    final_data = final_data.filter(e => {
      const len = get_manager_project_client.filter(i => i.project_client_id===e.client_id)
      if(len.length > 0) return e
    })
  }
  res.status(200).json({
    status: true,
    data : final_data
  })
})

exports.getClient = catchAsyncErrors(async (req, res, next)=> {

  const client_id = req.params.client_id

  const client_data = await Client.getClientbyId(client_id);
  if(!client_data){
    return next(new ErrorHandler(`The entered Client ID is invalid`, 400))
  }
  
  res.status(200).json({
    status: true,
    data: client_data
  })
})

exports.update = catchAsyncErrors(async (req, res, next)=> {
 
  const client_id = req.params.client_id
  const client_data = await Client.getClientbyId(client_id);


  if(!client_data){
    return next(new ErrorHandler(`The entered Client ID is invalid`, 400))
  }

  const {name, email, contact, status, address, ...rest} = req.body
  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

  
  let validation = new Validator(req.body,{
    name : 'required',
    email : ['required', 'email'],
    contact : ['required', 'integer'],
    address: 'required',
    status :  [{ 'in': ['Active', 'In Active'] }]
  });

  let errObj = null
  validation.checkAsync(null, ()=>{
      errObj = validation.errors.all()
      for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
      }
  });

  if(!errObj){

      const checkEmail = await User.findByEmail(req.body.email)
      if(checkEmail){
        return next(new ErrorHandler("Sorry! given email is already taken", 400))
      }

      const updating_data = {client_name: req.body.name, client_address: req.body.address, client_email: req.body.email, client_contact: req.body.contact, client_status: req.body.status}
      const client = await Client.update(updating_data, client_id)

      res.status(201).json({
        success: true,
        client
      })
  }
})

// Delete the client related projects and tasks
exports.deleteClient = catchAsyncErrors(async (req,res, next)=>{
  const client_id = req.params.client_id
  const client_data = await Client.getClientbyId(client_id);
  if(!client_data){
    return next(new ErrorHandler(`The entered Client ID is invalid`, 400))
  }

  await Client.deleteClient(client_id)
  const project_data = await Project.getProjectsbyClientId(client_id)
  const project_ids = project_data.map(e => e.project_id)

  if(project_data.length > 0){
    await Project.deleteProjectbyClientId(client_id)
    if(project_ids.length > 0){
      await Task.deleteByProjectId(project_ids)
    }
  }

  res.status(200).json({
    status: true,
    message: "Client deleted successfully!"
  })
})

// 
exports.sendMailToClient = catchAsyncErrors(async (req,res, next)=>{
  const {project_id, subject, message} = req.body;

  let validation = new Validator(req.body,{
    project_id : 'required',
    subject : 'required',
    message : 'required',
  });

  
  let errObj = null
  validation.checkAsync(null, ()=>{
      errObj = validation.errors.all()
      for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
      }
  });

if(!errObj){

    const project_data = await Project.getProjectbyId(project_id);
    if(!project_data){
      return next(new ErrorHandler(`Invalid project id`, 400))
    }

    const client_data = await Client.getClientbyId(project_data.project_client_id);

    const isHisProject = await DBValidation.isHisProject(project_id, req.user)
    if(!isHisProject){
      return next(new ErrorHandler(`Invalid project`, 400))
    }

    const user_data = await User.findByEmail(req.user.email);

    const __basedir = path.resolve();
    const mail = sendMail(user_data[0].email, user_data[0].email_password, client_data.client_email, subject, message, __basedir + "/resources/static/assets/uploads/attach/" + req.file.filename)

    res.status(200).json(mail)
  }
})


// Get Inbox
exports.getInbox = catchAsyncErrors(async (req,res, next)=>{
  var Imap = require('node-imap'),
  inspect = require('util').inspect;

  const user_data = await User.findByEmail(req.user.email);

  const host_check = (user_data[0].email).split('@')[1] === 'gmail.com' ? "imap.gmail.com" : (user_data[0].email).split('@')[1] === 'hotmail.com' ? "outlook.office365.com" : ""

  if(host_check === ""){
    return next(new ErrorHandler(`Gmail and Hotmail are accessible`, 400))
  }
  var imap  = new Imap({
    user: user_data[0].email,
    password: user_data[0].email_password,
    host: host_check,
    port: 993,
    tls: true
  });

  let header = []

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  
  imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    var f = imap.seq.fetch('1:3', {
      bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
      struct: true
    });
    f.on('message', function(msg, seqno) {
      //console.log('Message #%d', seqno);
      var prefix = '(#' + seqno + ') ';
      msg.on('body', function(stream, info) {
        var buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          const headerInfo = Imap.parseHeader(buffer)
          //console.log(prefix + 'Parsed header: %s', headerInfo);
          header.push(headerInfo)
        });
      });
      msg.once('attributes', function(attrs) {
        //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
      });
      msg.once('end', function() {
        //console.log(prefix + 'Finished');
      });
    });
    f.once('error', function(err) {
      //console.log('Fetch error: ' + err);
    });
    f.once('end', function() {
      //console.log('Done fetching all messages!');
      imap.end();
    });
  });
  });

  imap.once('error', function(err) {
    //console.log(err);
  });

  imap.once('end', function() {
    //console.log('Connection ended');

    // header = header.toString()
    // header = header.replace(/\n/g,'')
    //                 .replace(/[\n\r]/g,'')
    

    return res.status(200).json({
      status: true,
      
      result: header
    })
  });

  imap.connect();

})