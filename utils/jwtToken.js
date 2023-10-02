const User = require("../models/user.model")
const UserToken = require("../models/user_token.model")

// Create and send token and save in the cookie
const sendToken = async (user, statuscode, res) => {

    //Create Jwt token
    const token = User.getJwtToken(user[0].email)

    //Options for cookie 
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    const user_data = {
        user_id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        avatar: process.env.HOST_URL +''+ user[0].avatar,
        status: user[0].status,
        token
     }
    
    let today = new Date();
    const nextWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 7 * 1,
        today.getHours(),
        today.getMinutes(),
        today.getSeconds(),
        today.getMilliseconds()
    );
     // Create a Vendor
     const userToken = new UserToken({
        user_id: user[0].user_id,
        token_id: token,
        valid_till : nextWeek
     });
 
     await UserToken.create(userToken)

    res.status(statuscode).cookie('token', token, options).json({
        success: true,
        user: user_data
    })
}

module.exports = sendToken