// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Post = function (post) {
  this.desc = post.desc;
  this.userid = post.userid;
};

Post.create = (post) => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "INSERT INTO posts SET ?"; // SQL query to insert the comment
    sql.query(sqlQuery, post, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};
Post.getPostById = (userId) => {
    return new Promise((resolve, reject) => {
   
     const sqlQuery = typeof userId !== "undefined"
     ? `SELECT p.*,username ,u.id AS userId, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userId) WHERE p.userId = ? ORDER BY p.createdAt DESC`
     : `SELECT p.*, u.id AS userId, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userId)
     LEFT JOIN relationships AS r ON (p.userId = r.followedUserId) WHERE r.followerUserId= ? OR p.userId =?
     ORDER BY p.createdAt DESC`;
     const values =
     userId !== "undefined" ? [userId] : [userId, userId];
      sql.query(sqlQuery, [userId], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });

};


module.exports = Post;
