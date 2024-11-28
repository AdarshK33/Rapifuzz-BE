const sql = require("./db.js");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// constructor
const User = function (user) {
  this.email = user.email;
  this.password = user.password;
};

User.create = (user) => {
  console.log(user, "hello modal");
  return new Promise((resolve, reject) => {
    sql.query("INSERT INTO users SET ?", user, (err, res) => {
      console.log("hello");
      if (err) {
        reject(err);
        return;
      }
      let user_id = "";

      user_id = `ADMIN-${res.insertId}`;
      sql.query(
        "UPDATE users SET user_id=? WHERE id=?",
        [user_id, res.insertId],
        (err, res1) => {
          resolve({ user_id: user_id, user });
          return;
        }
      );
    });
  });
};

User.getAll = (
  user_id,
  name,
  email,
  role,
  status,
  perPage,
  pageNumber,
  searchKey,
  designation,
  host
) => {
  return new Promise((resolve, reject) => {
    let query =
      "SELECT user_id, name, email, avatar, role, status,current_project, modifiedAt, designation,createdAt FROM users WHERE 1=1 ";

    if (searchKey) {
      query += ` AND (user_id LIKE '%${searchKey}%' OR name LIKE '%${searchKey}%' OR email LIKE '%${searchKey}%' OR role LIKE '%${searchKey}%' OR status LIKE '%${searchKey}%')`;
    }

    if (user_id) {
      query += ` AND user_id = '${user_id}'`;
    }

    if (name) {
      query += ` AND name = '${name}'`;
    }

    if (email) {
      query += ` AND email = '${email}'`;
    }

    if (role) {
      query += ` AND role = '${role}'`;
    }

    if (designation) {
      query += ` AND role = '${designation}'`;
    }

    if (status) {
      query += ` AND status = '${status}'`;
    }

    query += ` ORDER BY modifiedAt DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber - 1) * perPage}, ${perPage}`;
    }

    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      if (res) {
        res = res.map((e) => {
          e.avatar = e.avatar === "" ? "" : encodeURI(host + e.avatar);
          return e;
        });
        resolve(res);
      } else {
        resolve([]);
      }
      return;
    });
  });
};

User.updateByHim = (name, email_password, user_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "UPDATE users SET name=?,  email_password=? WHERE user_id = ?",
      [name, email_password, user_id],
      (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
        return;
      }
    );
  });
};

User.update = (
  name,
  password,
  email,
  email_password,
  role,
  status,
  designation,
  user_id
) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "UPDATE users SET name=?, password=? , email=? , email_password=?, role=?, status=? ,designation=? WHERE user_id = ?",
      [
        name,
        password,
        email,
        email_password,
        role,
        status,
        designation,
        user_id,
      ],
      (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
        return;
      }
    );
  });
};

User.findByEmail = (email) => {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM users WHERE email = ?`, [email], (err, res) => {
      if (err) {
        return reject(err);
      }
      if (res.length == 0) {
        resolve(null);
      }
      resolve(res);
    });
  });
};

User.findByEmailForUserUpdate = (email, user_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT * FROM users WHERE email = ? AND user_id != ?`,
      [email, user_id],
      (err, res) => {
        if (err) {
          return reject(err);
        }
        if (res.length == 0) {
          resolve(null);
        }
        resolve(res);
      }
    );
  });
};

User.isValidEmail = (email) => {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM users WHERE email = ?`, [email], (err, res) => {
      if (err) {
        return reject(false);
      }
      if (res.length == 0) {
        resolve(false);
      }
      resolve(res[0]);
    });
  });
};

//Compare user password
User.comparePassword = async function (enteredPassword, pass) {
  return await bcrypt.compare(enteredPassword, pass);
};

//Return JWT token
User.getJwtToken = function (email) {
  return jwt.sign({ email: email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

User.updateProfilePicPath = (email, file_path) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "UPDATE users SET avatar = ? WHERE email=?",
      [file_path, email],
      (err, res) => {
        if (err) {
          reject(null);
          return;
        }
        resolve(res[0]);
        return;
      }
    );
  });
};

User.createResetPasswordLink = (email, reset_link_token) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "UPDATE users SET reset_link = ? , reset_link_session = null, reset_link_time = (DATE_ADD(NOW(), INTERVAL 5 MINUTE)) WHERE email=?",
      [reset_link_token, email],
      (err, res) => {
        if (err) {
          reject(null);
          return;
        }
        resolve(res[0]);
        return;
      }
    );
  });
};

User.isResetPasswordLinkActive = (email, reset_link_token, session_link) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM users WHERE email = ? AND reset_link = ? AND reset_link_time > NOW()",
      [email, reset_link_token],
      (err, res) => {
        if (err) {
          return reject(0);
        }
        if (res.length == 0) {
          resolve(1);
          return;
        } else {
          sql.query(
            "UPDATE users SET reset_link = null , reset_link_time = null,  reset_link_session = ?, reset_link_session_time = (DATE_ADD(NOW(), INTERVAL 5 MINUTE)) WHERE email=?",
            [session_link, email],
            (err, res1) => {
              if (err) {
                reject(0);
                return;
              } else {
                resolve(2);
                return;
              }
            }
          );
        }
      }
    );
  });
};

User.resetPassword = (email, reset_token, new_password) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM users WHERE email = ? AND reset_link_session = ? AND reset_link_session_time > NOW()",
      [email, reset_token],
      (err, res) => {
        if (err) {
          return reject(0);
        }
        if (res.length == 0) {
          resolve(1);
          return;
        } else {
          sql.query(
            "UPDATE users SET reset_link_session = null , reset_link_session_time = null,  password = ? WHERE email=?",
            [new_password, email],
            (err, res1) => {
              if (err) {
                reject(0);
                return;
              } else {
                resolve(2);
                return;
              }
            }
          );
        }
      }
    );
  });
};

User.getUserProfile = (user, host) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM users WHERE email = ?",
      [user.email],
      (err, res) => {
        if (err) {
          return reject(null);
        }

        let info = {
          name: res[0].name,
          email: res[0].email,
          role: res[0].role,
          avatar: res[0].avatar == "" ? "" : encodeURI(host + res[0].avatar),
        };

        resolve(info);
      }
    );
  });
};

User.isManagerIsValid = (manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM users WHERE user_id=? AND role=?",
      [manager_id, "manager"],
      (err, res) => {
        if (err) reject(false);

        if (res.length === 0) resolve(false);
        resolve(true);
      }
    );
  });
};

User.isUsersValid = (users) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM `users` WHERE `user_id` IN (?) AND role='user'",
      [users],
      (err, res) => {
        if (err) reject(false);

        if (res === undefined || res.length === 0) {
          resolve(false);
          return;
        }

        if (users.length !== res.length) {
          resolve(false);
          return;
        }

        resolve(true);
      }
    );
  });
};

User.isUsersValidWhileAdding = (users) => {
  return new Promise((resolve, reject) => {
    sql.query(
      "SELECT * FROM `users` WHERE `user_id` IN (?) AND (role='user' OR role='manager')",
      [users],
      (err, res) => {
        if (err) reject(false);

        if (res === undefined || res.length === 0) {
          resolve(false);
          return;
        }

        if (users.length !== res.length) {
          resolve(false);
          return;
        }

        resolve(true);
      }
    );
  });
};

User.getUserbyId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM users WHERE user_id=?", user_id, (err, res) => {
      if (err) reject(null);
      resolve(res[0]);
    });
  });
};

User.getUserbyRole = (role) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM users WHERE role=?", role, (err, res) => {
      if (err) reject(null);
      resolve(res[0]);
    });
  });
};

User.deleteUserbyId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query(
      `DELETE FROM users WHERE user_id IN (?)`,
      [user_id],
      (err, res) => {
        if (err) reject(null);
        resolve(res);
      }
    );
  });
};

User.getUsersbyAdmin = () => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM users", null, (err, res) => {
      if (err) reject(null);
      if (res) {
        resolve(res);
      } else {
        resolve([]);
      }
    });
  });
};

module.exports = User;
