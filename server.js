const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv');
const errorMiddleware = require('./middlewares/errors')
const app = express();
dotenv.config({ path: 'config/config.env' })
app.use(cors())
// parse requests of content-type - application/json
app.use(express.json());
app.use(cookieParser())
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); /* bodyParser.urlencoded() is deprecated */

//Default route
// app.get("/", (req, res) => {
//   application.use("/public", express.static(path.join(__dirname, 'public')));
// });

// Frontend Routes enabling 
app.use(express.static(__dirname + '/public'));

app.use('/login', express.static(__dirname + '/public'));
app.use('/reset-password', express.static(__dirname + '/public'));
app.use('/newpassword/:email/:token', express.static(__dirname + '/public'));

app.use('/dashboard', express.static(__dirname + '/public'));
app.use('/add-client', express.static(__dirname + '/public'));
app.use('/all-clients', express.static(__dirname + '/public'));
app.use('/project-console', express.static(__dirname + '/public'));
app.use('/add-project', express.static(__dirname + '/public'));
app.use('/all-projects', express.static(__dirname + '/public'));
app.use('/task-console', express.static(__dirname + '/public'));
app.use('/add-user', express.static(__dirname + '/public'));
app.use('/all-users', express.static(__dirname + '/public'));
app.use('/calendar', express.static(__dirname + '/public'));
app.use('/inbox', express.static(__dirname + '/public'));
app.use('/send-report', express.static(__dirname + '/public'));
app.use('/pending-projects', express.static(__dirname + '/public'));
app.use('/completed-projects', express.static(__dirname + '/public'));
app.use('/profile-details', express.static(__dirname + '/public'));
app.use('/download-reports', express.static(__dirname + '/public'));
app.use('/add-task', express.static(__dirname + '/public'));
app.use('/all-tasks', express.static(__dirname + '/public'));

//  Frontend routes ends here 


app.use('/resources/static/assets/uploads/userpic/', express.static(__dirname + '/resources/static/assets/uploads/userpic/'));
const { isAuthenticatedUser } = require("./middlewares/auth");


//Import all Routes

const auth = require('./routes/auth.routes');

const user = require('./routes/user.routes');


const logger = require("./logger");


app.use('/api/auth', auth)
// app.use(isAuthenticatedUser)

app.use('/api/user', user)




//Middleware to handle errors
app.use(errorMiddleware);

// set port, listen for requests
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  
  console.log(`Server is running on port ${PORT} on ${process.env.NODE_ENV} Environment`);
})

//Handle unhandle Promise rejection
process.on('unhandledRejection', err => {
  console.log('Shutting down the server due to unhandled promise rejection');
  logger.debug(`ERROR: ${err.stack}`)
  server.close(() => {
    process.exit(1)
  })
})

//Handle Uncaught Exception
process.on('uncaughtException', err => {
  console.log('Shutting down the server due to uncaught exception');
  logger.debug(`ERROR: ${err.stack}`)
  server.close(() => {
    process.exit(1)
  })
})
