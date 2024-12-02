const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const errorMiddleware = require("./middlewares/errors");
const app = express();
dotenv.config({ path: "config/config.env" });
app.use(cors());
// parse requests of content-type - application/json
app.use(express.json());
app.use(cookieParser());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(
  express.urlencoded({ extended: true })
); /* bodyParser.urlencoded() is deprecated */

//Default route
// app.get("/", (req, res) => {
//   application.use("/public", express.static(path.join(__dirname, 'public')));
// });

// Frontend Routes enabling
app.use(express.static(__dirname + "/public"));

app.use("/login", express.static(__dirname + "/public"));
app.use("/reset-password", express.static(__dirname + "/public"));
app.use("/newpassword/:email/:token", express.static(__dirname + "/public"));




app.use("/add-user", express.static(__dirname + "/public"));
app.use("/all-users", express.static(__dirname + "/public"));

app.use("/inbox", express.static(__dirname + "/public"));

//  Frontend routes ends here

app.use(
  "/resources/static/assets/uploads/userpic/",
  express.static(__dirname + "/resources/static/assets/uploads/userpic/")
);
const { isAuthenticatedUser } = require("./middlewares/auth");

//Import all Routes

const auth = require("./routes/auth.routes");

const user = require("./routes/user.routes");
const comment = require("./routes/comment.routes");
const like = require("./routes/like.routes");
const post = require("./routes/post.routes");
const relation = require("./routes/relation.routes");
const story = require("./routes/story.routes");






const logger = require("./logger");
app.use("/api/auth", auth);
// app.use(isAuthenticatedUser)
// 
app.use("/api/user", user);
app.use("/api/comment", comment);
app.use("/api/like", like);
app.use("/api/post", post);
app.use("/api/relation", relation);
app.use("/api/story", story);








//Middleware to handle errors

app.use(errorMiddleware)  

// set port, listen for requests
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} on ${process.env.NODE_ENV} Environment`
  );
});

//Handle unhandle Promise rejection
process.on("unhandledRejection", (err) => {
  console.log("Shutting down the server due to unhandled promise rejection");
  logger.debug(`ERROR: ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});

//Handle Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log("Shutting down the server due to uncaught exception");
  logger.debug(`ERROR: ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});
