const nodemailer = require("nodemailer");
const logger = require("../logger");


const sendMail = async (sender_mail, sender_password, receiver_address, subject, message, file) =>{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: sender_mail,
          pass: sender_password
        }
      });
          
      var mailOptions = {
        from: sender_mail,
        to: receiver_address,
        subject: subject,
        html: message,
        attachments: {   // utf-8 string as an attachment
          path: file
        }
      };
      
      //Sending Reset Link
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          logger.debug(`ERROR: ${error}`)
          //console.log('Email not sent: ' + error);
          return {success: true, message: "Mail sent successfully!"}
        } else {
          //console.log('Email sent: ' + info.response);
          return {success: false, message: "Mail not sent!"}
        }
      });
}

module.exports = sendMail
