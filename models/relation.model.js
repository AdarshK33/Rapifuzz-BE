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
    //    console.log("followeruserid",userid)
    const sqlQuery = "SELECT * FROM relationships WHERE followeruserid = ?";

    sql.query(sqlQuery, [id], (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

Relation.deleteRelationship = (followerUserId, followedUserId) => {
  // followedUserId/ req.body
  return new Promise((resolve, reject) => {
    const sqlQuery =
      "DELETE FROM relationships WHERE `followerUserId` = ? AND `followedUserId` = ?";

    sql.query(sqlQuery, [followerUserId, followedUserId], (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

Relation.findFriend = (id,host) => {
 // const { id } = userObj;

  return new Promise((resolve, reject) => {
    // SQL query to find users who are not followed by the given user
    const sqlQuery = `
      SELECT u.id, u.name, u.userName,u.avatar
      FROM users u
      WHERE u.id != ?  
      AND u.id NOT IN (
        SELECT f.followeduserid   
        FROM relationships f 
        WHERE f.followeruserid = ?
      );
    `;
    // Execute the query
    sql.query(sqlQuery, [id, id], (err, res) => {
      if (err) {
        reject(err); // Handle errors
        return;
      }
      

      const info = res.map(user => ({
        name: user.name,
        userName: user.userName,
        id: user.id,
        avatar: user.avatar ? encodeURI(host + user.avatar) : ""
      }));
      resolve(info); // Return results
    });
  });
};

module.exports = Relation;
