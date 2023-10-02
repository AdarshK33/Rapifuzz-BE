const cron = require('node-cron');
const { checkForProjectDeadlines } = require('./controllers/project.controller');
const sql = require("./models/db")
const nodemailer = require("nodemailer");
const { getDeadlineMailTemplate, weeklyReport } = require('./utils/emailTemplate');
const logger = require("./logger");
const { createAppNotification } = require('./controllers/appnotification.controller');
const { getUserbyRole } = require('./models/user.model');
const { project_deadline_for_manager, weekly_report_remainder_for_manager } = require('./utils/notifMessageTemplate');


//cron.schedule('10 21 * * * *',   () => {
cron.schedule('10 9 7 * * *',   () => {
    return new Promise((resolve, reject)=> {
        sql.query(`SELECT projects.project_id,  projects.project_name,  projects.project_status, projects.project_end_date,  projects.project_manager_id,
        JSON_OBJECT('manager_email', users.email, 'manager_name', users.name, 'manager_email_password', users.email_password, 'manager_status', users.status) AS users
        FROM projects 
         INNER JOIN users ON users.user_id = projects.project_manager_id AND users.status='Active' WHERE projects.project_end_date = CURDATE()`,[], async (err, res)=> {

          if(err) reject(err)
          const data = res.map(e => { 
            const users = JSON.parse(e.users)
            Object.assign(e, {users})
            return e
          })
          
          data.map(e => {
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            });
            
            let message = getDeadlineMailTemplate(e.users.manager_name, e.project_name, e.project_end_date) 
        
            var mailOptions = {
              from: process.env.EMAIL_USER,
              to: e.users.manager_email,
              subject: `${e.project_name} deadline reminder`,
              html: message
            };
            
            //Sending Reset Link
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                logger.debug(`ERROR: ${error}`)
                //console.log('Email not sent: ' + error);
              } else {
                //console.log('Email sent: ' + info.response);
              }
            });
          })

          const admin_data = await getUserbyRole("admin");
          data.map(async e => {
            await createAppNotification(admin_data.user_id, 'admin', e.project_manager_id, 'manager', 'project_deadline', project_deadline_for_manager(e.project_name))
          })


          resolve(data)
        })
    })
});

cron.schedule('1 34 15 * * *',   () => {
  return new Promise((resolve, reject)=> {
      sql.query(`SELECT * FROM users WHERE role='manager' AND status='Active'`,[], async (err, res)=> {

        if(err) reject(err)
        
        if(res){
          res.map(e => {
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            });
            
            let message = weeklyReport("Dear Team,", "") 
          
            var mailOptions = {
              from: process.env.EMAIL_USER,
              to: e.email,
              subject: `Weekly Reports Reminder`,
              html: message
            };
            
            //Sending Reset Link
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                logger.debug(`ERROR: ${error}`)
                //console.log('Email not sent: ' + error);
              } else {
                //console.log('Email sent: ' + info.response);
              }
            });
          })
  
          const admin_data = await getUserbyRole("admin");
          res.map(async e => {
            await createAppNotification(admin_data.user_id, 'admin', e.user_id, 'manager', 'weekly_report', weekly_report_remainder_for_manager())
          })
  
  
          resolve(res)
        }
        else{
          resolve([])
        }
        
      })
  })
});

cron.schedule('10 11 12 * * *',   () => {
  
});

module.exports = cron