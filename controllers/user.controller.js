const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
let Validator = require('validatorjs');
const User = require("../models/user.model");
const path = require("path");
const bcrypt = require('bcryptjs');
const sendToken = require("../utils/jwtToken");
const UserToken = require("../models/user_token.model");




//Add  User
exports.add = catchAsyncErrors(async (req, res, next) => {
  let { name, email, password, role, status, email_password, current_project, designation, ...rest } = req.body
  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

  let validation = new Validator(req.body, {
    name: 'required',
    email: ['required', 'email'],
    password: 'required',
    role: [{ 'in': ['admin', 'manager', 'user'] }],
    status: [{ 'in': ['Active', 'In Active'] }],
    designation: [{ 'in': ['Tester', 'Developer', 'BA', 'HR', 'Sr. Developer', ' Data Analyst', 'Lead', 'Project Manager'] }]
  });

  const checkEmail = await User.findByEmail(req.body.email)
  if (checkEmail) {
    return next(new ErrorHandler("Sorry! given email is already taken", 400))
  }

  let errObj = null
  validation.checkAsync(null, () => {
    errObj = validation.errors.all()
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
    }
  });

  if (!errObj) {
    password = await bcrypt.hash(req.body.password, 10)
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: password,
      role: req.body.role,
      status: req.body.status,
      email_password: req.body.email_password,
      current_project: req.body.current_project || 0,
      designation: req.body.designation
    }

    const userCreate = await User.create(user);

    res.status(201).json({
      success: true,
      message: "User added successfully!"
    })
  }
})


// Retrieve all
exports.all = catchAsyncErrors(async (req, res, next) => {
  const user_id = req.query.user_id
  const name = req.query.name
  const status = req.query.status
  const email = req.query.email
  const role = req.query.role
  const project_id = req.query.project_id
  const current_project = req.query.current_project
  const designation = req.query.designation



  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  perPage = perPage === "all" ? "" : perPage

  let searchKey = req.query.searchKey

  if (perPage < 0 || pageNumber < 0) {
    perPage = "";
    pageNumber = "";
  }

  let final_data = await User.getAll(user_id, name, email, role, status, perPage, pageNumber, searchKey, current_project, designation, process.env.HOST_URL)

  if (project_id) {
    const project_data = await Project.getProjectbyId(project_id);
    if (project_data) {
      const all_proj_users = project_data.project_user_ids + ''.split(',')
      let final_user_data = final_data.filter(e => all_proj_users.includes(e.user_id))
      let final_manager_data = final_data.filter(e => project_data.project_manager_id === e.user_id)

      final_user_data = [...final_user_data, final_manager_data[0]]
      final_data = final_user_data
      console.log("final_datafinal_data", final_data, final_user_data, final_manager_data[0]);
    }
  }

  res.status(200).json({
    status: true,
    data: final_data
  })
})

// Delete the User
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user_id = req.params.user_id

  const user_data = await User.getUserbyId(user_id);
  const roleData = await UserProject.isValidRole(user_id) //fetching from user table
  const checkCurrentProjectCount = await UserProject.isValidCurrentProject(user_id) //its giving integer 0,1,2.., fetching from user table
  // console.log(checkCurrentProjectCount, "checkCurrentProjectCount")
  if (!user_data) {
    return next(new ErrorHandler(`Invalid user id`, 400))
  }
  if (checkCurrentProjectCount !== 0) {
    return next(new ErrorHandler(`${roleData} is active in a project`, 400))
  }


  await User.deleteUserbyId(user_id)
  await UserProject.deleteUserProjectbyUserId(user_id) //user project deleting user + projecct id


  res.status(200).json({
    status: true,
    message: "User deleted successfully!"
  })
})

// Change user pic
exports.changeUserPic = catchAsyncErrors(async (req, res, next) => {

  const __basedir = path.resolve();

  if (req.file == undefined) {
    return res.status(400).send("Please upload profile pic (Image file only)!");
  }

  let uploadedpath = "/resources/static/assets/uploads/userpic/" + req.file.filename;

  const data = await User.updateProfilePicPath(req.user.email, uploadedpath)

  res.status(200).json({
    success: true,
    path: uploadedpath
  })
});


// Change user pic
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {

  const __basedir = path.resolve();

  const user_profile = await User.getUserProfile(req.user, process.env.HOST_URL)
  res.status(200).json({
    success: true,
    user_profile
  })
});

exports.getUser = catchAsyncErrors(async (req, res, next) => {

  const user_id = req.params.user_id
  const user_data = await User.getUserbyId(user_id);


  if (!user_data) {
    return next(new ErrorHandler(`Invalid user id`, 400))
  }

  res.status(200).json({
    status: true,
    data: user_data
  })
})

//Login  User => /api/login
exports.update = catchAsyncErrors(async (req, res, next) => {

  const user_data = await User.getUserbyId(req.user.user_id)
  if (!user_data) {
    return next(new ErrorHandler('User not found', 400))
  }


  let name = req.body.name ? req.body.name : user_data.name
  let email_password = req.body.email_password ? req.body.email_password : user_data.email_password

  const data = await User.updateByHim(name, email_password, req.user.user_id);

  res.status(200).json({
    success: true,
    message: "Profile updated!"
  })
})

//Login  User => /api/login
exports.updateByAdmin = catchAsyncErrors(async (req, res, next) => {

  const user_id = req.params.user_id
  const user_data = await User.getUserbyId(user_id);

  if (!user_data) {
    return next(new ErrorHandler('User not found', 400))
  }


  let name = req.body.name ? req.body.name : user_data.name
  let email = req.body.email ? req.body.email : user_data.email
  let email_password = req.body.email_password ? req.body.email_password : user_data.email_password
  let role = req.body.role ? req.body.role : user_data.role
  let status = req.body.status ? req.body.status : user_data.status
  let password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user_data.password
  let designation = req.body.designation ? req.body.designation : user_data.designation


  if (user_id === req.user.user_id) {
    role = req.user.role
  }

  if (user_id === req.user.user_id) {
    status = req.user.status
  }

  if (!['admin', 'manager', 'user'].includes(role)) {
    return next(new ErrorHandler("Invalid user role", 400))
  }

  if (!['Active', 'In Active'].includes(status)) {
    return next(new ErrorHandler("Invalid user status", 400))
  }

  const checkEmail = await User.findByEmailForUserUpdate(email, user_id)
  if (checkEmail) {
    return next(new ErrorHandler("Sorry! given email is already taken", 400))
  }

  const data = await User.update(name, password, email, email_password, role, status, designation, user_id);

  res.status(200).json({
    success: true,
    data
  })
})

// Delete the client related projects and tasks
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {

  await UserToken.deleteToken(req.user.user_id, req.user.token_id)

  res.status(200).json({
    status: true,
    message: "Logout successfull"
  })
})




