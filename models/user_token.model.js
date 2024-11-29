const sql = require("./db.js");

// constructor
const UserToken = function (userToken) {
  this.user_id = userToken.user_id;
  this.token_id = userToken.token_id;
  this.valid_till = userToken.valid_till;
};

UserToken.create = (userToken) => {
  return new Promise((resolve, reject) => {
    sql.query("INSERT INTO user_tokens SET ?", userToken, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

UserToken.isValidToken = (user_id, token_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT * FROM user_tokens WHERE user_id = ? AND token_id = ? AND valid_till > NOW()`,
      [user_id, token_id],
      (err, res) => {
        if (err) {
          return reject(false);
        }
        if (res.length == 0) {
          resolve(false);
        }
        resolve(true);
      }
    );
  });
};

UserToken.deleteToken = (user_id, token_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      `DELETE FROM user_tokens WHERE user_id = ? AND token_id = ?`,
      [user_id, token_id],
      (err, res) => {
        if (err) reject(null);
        resolve(res);
      }
    );
  });
};

module.exports = UserToken;
