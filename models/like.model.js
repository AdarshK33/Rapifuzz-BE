// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Like = function (comment) {
  this.userid = comment.userid;
  this.postid = comment.postid;
};

Like.create = (like) => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "INSERT INTO likes SET ?"; // SQL query to insert the comment
    sql.query(sqlQuery, like, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

  
Like.getLikeById = (postid) => {
    return new Promise((resolve, reject) => {
    const sqlQuery = `SELECT userId from Likes WHERE postId = ?`;


      sql.query(sqlQuery, [postid], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });
  };
  

Like.deleteLike = (userid,postid) => {
    return new Promise((resolve, reject) => {
    const sqlQuery =  "DELETE FROM likes WHERE `userId` = ? AND `postId` = ?";


      sql.query(sqlQuery, [userid,postid], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });
  };
  



module.exports = Like;
