// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Story = function (story) {
  this.userid = story.userid;
 
};

Story.create = (story) => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "INSERT INTO stories SET ?"; // SQL query to insert the comment
    sql.query(sqlQuery, story, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};
Story.getStoryById = (id) => {
    return new Promise((resolve, reject) => {
//    console.log("getRelationById",id)
        const sqlQuery= `SELECT s.*, u.username FROM stories AS s, users AS u WHERE u.id = s.userId;`;

      sql.query(sqlQuery, [id], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });

};


module.exports = Story;
