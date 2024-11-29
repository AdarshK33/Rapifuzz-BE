// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Relation = function (relation) {
  this.followeruserid = relation.followeruserid;
  this.followeduserid = relation.followeduserid;
};

Relation.create = (relation) => {
  return new Promise((resolve, reject) => {
    const sqlQuery = "INSERT INTO relationships SET ?"; // SQL query to insert the comment
    sql.query(sqlQuery, relation, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};
Relation.getRelationById = (id) => {
    return new Promise((resolve, reject) => {
//    console.log("getRelationById",id)
        const sqlQuery= "SELECT followerUserId FROM relationships WHERE followedUserId = ?";

      sql.query(sqlQuery, [id], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });

};

Relation.deleteRelationship = (followerUserId,followedUserId) => {
   // followedUserId/ req.body
    return new Promise((resolve, reject) => {
   
        const sqlQuery=  "DELETE FROM relationships WHERE `followerUserId` = ? AND `followedUserId` = ?";

      sql.query(sqlQuery, [followerUserId,followedUserId], (err, res) => {
       
        if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
    });

};


module.exports = Relation;
