// models/comment.js

const sql = require("./db"); // Ensure this is your database connection

const Story = function (story) {
  this.userid = story.userid;
};

// Story.create = (file_path, id) => {
//   return new Promise((resolve, reject) => {

//     const sqlQuery = "INSERT INTO stories SET ?"; // SQL query to insert the comment
//     sql.query(sqlQuery, id, (err, res) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(res);
//     });
//     sql.query("UPDATE stories SET img = ? WHERE userid=?", [file_path, id], (err, res) => {
//       if (err) {
//         reject(null)
//         return
//       }
//       resolve(res[0])
//       return
//     })
//   });
// };
Story.getStoryById = (id,host) => {
  return new Promise((resolve, reject) => {
    //    console.log("getRelationById",id)
    const sqlQuery = `SELECT *
            FROM stories 
            WHERE userid = ?`;

    sql.query(sqlQuery, [id], (err, res) => {
      if (err) {
        reject(err);
        return;
      }
    

      const info = res.map(user => ({
        id: user.id,
        userid: user.userid,
        img: user.img ? encodeURI(host + user.img) : ""
      }));
      resolve(info); // Return results
    });
  });
};
Story.create = (file_path, userid) => {
  return new Promise((resolve, reject) => {
    // if (typeof id !== 'number' || isNaN(id)) {
    //   reject(new Error('Invalid user ID: must be an integer'));
    //   return;
    // }

    //     const filePath = '/resources/static/assets/uploads/userpic/image-admin-1732895075021-userlogo.png';
    // const userId = 1;

    console.log(userid, "userid");
    // Insert into the stories table without starting a transaction
    const insertQuery = "INSERT INTO stories (img, userid) VALUES (?, ?)";
    sql.query(insertQuery, [file_path, userid], (err, insertRes) => {
      if (err) {
        reject(err); // Reject if insert fails
        return;
      }
      resolve(insertRes); // Resolve if insert succeeds
    });
  });
};

module.exports = Story;
