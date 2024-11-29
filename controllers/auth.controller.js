const User = require("../models/user.model.js");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const { randomStringAsBase64Url } = require("../utils/common.js");
const nodemailer = require("nodemailer");
const path = require("path");
const logger = require("../logger");
let Validator = require("validatorjs");
const { getResetEmailTemplate } = require("../utils/emailTemplate.js");
const UserToken = require("../models/user_token.model.js");

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password, userName, phoneNumber } = req.body;

  // Check if user entered email, username, or phone number and password
  if (!email && !userName && !phoneNumber || !password) {
    return next(new ErrorHandler("Please enter email, username, phone number & password", 400));
  }

  // Determine which field to use for login (email, username, or phoneNumber)
  let field = '';
  let value = '';
  if (email) {
    field = 'email';
    value = email;
  } else if (userName) {
    field = 'userName';
    value = userName;
  } else if (phoneNumber) {
    field = 'phoneNumber';
    value = phoneNumber;
  }

  // Fetch user by the appropriate field (email, username, or phone number)
  let user = await User.findUserByField(field, value);

  if (!user) {
    return next(new ErrorHandler("Invalid Email, Username or Password", 401));
  }

  if (user[0].status === "In Active") {
    return next(new ErrorHandler("User is disabled", 401));
  }

  // Check if password is correct
  const isPasswordMatched = await User.comparePassword(password, user[0].password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email, Username or Password", 401));
  }

  // Send authentication token (assuming `sendToken` is implemented elsewhere)
  await sendToken(user, 200, res);
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, ...rest } = req.body;
  const other = Object.keys(rest);
  other.map((e) => {
    return next(
      new ErrorHandler(
        `Please remove unwanted fields ${e} from request body`,
        400
      )
    );
  });

  if (!email) {
    return next(new ErrorHandler("Email field can not be empty!"), 400);
  }
  const isValidEmail = await User.isValidEmail(email);

  if (!isValidEmail)
    return next(new ErrorHandler("Invalid email address!"), 400);

  const __basedir = path.resolve();

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const link_token = randomStringAsBase64Url(20);
  const link_address = process.env.EMAIL_URL;
  let link = `${link_address}newpassword/${email}/${link_token}`;
  let message = getResetEmailTemplate(isValidEmail.name, link);

  await User.createResetPasswordLink(email, link_token);

  var mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Password For Stack Holders",
    html: message,
  };

  //Sending Reset Link
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.debug(`ERROR: ${error}`);
    } else {
      //console.log('Email sent: ' + info.response);
    }
  });

  res.status(201).json({
    success: true,
    message: "Password Recovery Email Sent",
  });
});

//Login  User => /api/login
exports.resetPasswordSession = catchAsyncErrors(async (req, res, next) => {
  const { email, reset_token } = req.params;

  const isValidEmail = await User.isValidEmail(email);
  if (!isValidEmail)
    return next(new ErrorHandler("Invalid email address!"), 400);
  const link_token = randomStringAsBase64Url(20);
  const checkToken = await User.isResetPasswordLinkActive(
    email,
    reset_token,
    link_token
  );

  if (checkToken == 1) {
    return next(new ErrorHandler("Reset password link expired", 400));
  } else if (checkToken == 2) {
    return res.status(200).json({
      success: true,
      reset_session_link: link_token,
    });
  } else {
    return next(new ErrorHandler("Something went wrong", 400));
  }
});

//Add New Password
exports.newPasswordSet = catchAsyncErrors(async (req, res, next) => {
  // Input Validation
  const { email, reset_token, new_password, ...rest } = req.body;

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
    email: "required",
    reset_token: "required",
    new_password: "required",
  });

  let errObj = null;
  validation.checkAsync(null, () => {
    errObj = validation.errors.all();
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400));
    }
  });
  // Input Validation Ends
  if (!errObj) {
    const isValidEmail = await User.isValidEmail(email);
    if (!isValidEmail)
      return next(new ErrorHandler("Invalid email address!"), 400);
    const password = await bcrypt.hash(new_password, 10);
    const checkToken = await User.resetPassword(email, reset_token, password);
    if (checkToken == 1) {
      return next(new ErrorHandler("Reset password link expired", 400));
    } else if (checkToken == 2) {
      return res.status(200).json({
        success: true,
        message: "Password reset successfull!",
      });
    } else {
      return next(new ErrorHandler("Something went wrong", 400));
    }
  }
});
