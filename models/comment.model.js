// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Comment = function (comment) {
  this.desc = comment.desc;
  this.userid = comment.userid;
  this.postid = comment.postid;
};

Comment.create = (comment) => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "INSERT INTO comments SET ?"; // SQL query to insert the comment
    sql.query(sqlQuery, comment, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};
Comment.getCommentById = (id) => {
    return new Promise((resolve, reject) => {
    const sqlQuery = `SELECT c.*,username, u.id AS userId, name, profilePic FROM comments AS c JOIN users AS u ON (u.id = c.userId)
     WHERE c.postId = ? ORDER BY c.createdAt DESC`;


      sql.query(sqlQuery, [id], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });
  };
  
  



module.exports = Comment;
