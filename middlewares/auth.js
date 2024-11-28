const User = require('../models/user.model')
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const UserToken = require('../models/user_token.model');

//Check if User is Authenticated or not
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {

    // cookie based token
    //const token = req.cookies ? req.cookies.token : req.headers['authorization']; 

    // For localhost:3000 
    const bearerHearder = req.headers['authorization'];  
    if(!bearerHearder){
        return next(new ErrorHandler("Please provide access token", 403)) 
    }  
    const bearer = bearerHearder.split(' ');  
    const bearerToken = bearer[1];  
    const token = bearerToken; 
    // local setup ends here  

    if(!token){
        return next(new ErrorHandler('Login first to access this resource', 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.isValidEmail(decoded.email)
    if(!user){
        return next(new ErrorHandler("No access granted", 403))
    }else{
        if(user.status === 'In Active'){
            return next(new ErrorHandler('User is disabled', 401))
        }

        const isUserTokenValid = await UserToken.isValidToken(user.user_id, token)
        if(!isUserTokenValid){
            return next(new ErrorHandler('Invalid user token', 401))
        }

        req.user = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            token_id: token
         }
    }
    next()
})

//Handling users roles
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403))
        }
        next()
    }
}

