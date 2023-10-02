
const sql = require("./db.js");

// constructor
const UserProject = function (userProject) {
  this.user_id = userProject.user_id
  this.project_id = userProject.project_id
  this.status = userProject.status



};
// assign project api
UserProject.create = (userProject) => {
  // console.log(userProject, "userProject")
  return new Promise((resolve, reject) => {
    sql.query("INSERT INTO user_projects SET ?", userProject, (err, res) => {
      if (err) {
        reject(err)
        return;
      }
      resolve(res);
    })
  })
}


// getProjectByUserId for list of project 
UserProject.getProjectByUserId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query(`
      SELECT 
        user_projects.user_id, 
        user_projects.project_id,
        user_projects.status AS user_project_status,
        users.email AS user_email, 
        users.user_id AS user_id, 
        users.name AS user_name, 
        users.avatar AS user_avatar,
        users.role AS role, 
        users.status AS status,
        users.current_project AS current_project, 
        users.modifiedAt AS modifiedAt, 
        users.createdAt AS createdAt,
        JSON_OBJECT(
          'project_name', projects.project_name,
          'project_client_id', projects.project_client_id,
          'project_status', projects.project_status,
          'project_description', projects.project_description,
          'project_start_date', projects.project_start_date,
          'project_end_date', projects.project_end_date,
          'project_manager_id', projects.project_manager_id,
          'project_type', projects.project_type,
          'project_date_created', projects.project_date_created,
          'project_date_modified', projects.project_date_modified
        ) AS project,
        JSON_OBJECT('client_name', clients.client_name, 'client_id', clients.client_id, 'client_email', clients.client_email) AS clients
      FROM 
        user_projects 
        INNER JOIN users ON users.user_id = user_projects.user_id
        LEFT JOIN projects ON projects.project_id = user_projects.project_id
        INNER JOIN clients ON clients.client_id = projects.project_client_id
      WHERE 
        user_projects.user_id = ?
      ORDER BY 
        user_projects.user_id, user_projects.project_id
    `, user_id, (err, res) => {
      if (err) {
        reject(err); // Reject with the error object
      }
      if (res.length === 0) {
        const result = {
          user_id: user_id,
          user_email: "",
          user_name: "",
          user_avatar: "",
          role: "",
          status: "",
          modifiedAt: "",
          createdAt: "",
          current_project: 0,
          user_project_data: [] // Empty array since there are no projects
        };

        // User doesn't have any projects
        // console.log(res, "res")

        resolve(result);
      }
      else {
        const result = {
          user_id: res[0].user_id,
          user_email: res[0].user_email,
          user_name: res[0].user_name,
          user_avatar: res[0].user_avatar,
          role: res[0].role,
          status: res[0].status,
          modifiedAt: res[0].modifiedAt,
          createdAt: res[0].createdAt,
          current_project: res[0].current_project,
          user_project_data: []
        };

        if (res.project_name === null) {
          // console.log("res", res)
          // User doesn't have any projects
          resolve(result);
        } else {
          const projectMap = new Map(); // Map to store projects by project_id

          res.forEach(row => {

            const dataObj = {};
            if (row.project) {
              const project = JSON.parse(row.project);
              const clients = JSON.parse(row.clients);
              Object.assign(dataObj, project);
              Object.assign(dataObj, clients);

            }

            dataObj.user_project_status = row.user_project_status;

            const projectKey = row.project_id; // Use project_id as the key

            if (projectMap.has(projectKey)) {
              // Project already exists in the map
              const existingProject = projectMap.get(projectKey);
              // existingProject.user_project_status.push(dataObj.user_project_status);

            } else {
              // Create a new project object
              const newProject = {
                project_id: row.project_id,
                project_name: dataObj.project_name,
                project_client_id: dataObj.project_client_id,
                project_status: dataObj.project_status,
                project_description: dataObj.project_description,
                project_start_date: dataObj.project_start_date,
                project_end_date: dataObj.project_end_date,
                project_manager_id: dataObj.project_manager_id,
                project_type: dataObj.project_type,
                project_date_created: dataObj.project_date_created,
                project_date_modified: dataObj.project_date_modified,
                user_project_status: dataObj.user_project_status,
                client_name: dataObj.client_name, // Add client_name to the newProject object
                client_id: dataObj.client_id, // Add client_id to the newProject object
                client_email: dataObj.client_email
              };
              if (row.project_id !== null) {
                projectMap.set(projectKey, newProject);
              }
            }
          });
          // Add the projects from the map to the user_project_data array
          projectMap.forEach(project => {
            result.user_project_data.push(project);
          });

          resolve(result);
        }
      }
    });
  });
};

//check user 
UserProject.isUsersValid = (user_id, project_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM `user_projects` WHERE `user_id` IN (?) AND project_id=(?)", [user_id, project_id], (err, res) => {
      if (err) reject(false)


      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }

      resolve(true)
    })
  })
}

UserProject.isValidUserProjectStatus = (user_id, project_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT status FROM `user_projects` WHERE `user_id` IN (?) AND project_id=(?)", [user_id, project_id], (err, res) => {
      if (err) reject(false)

      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      // console.log(res[0].status)
      resolve(res[0].status)
    })
  })
}

UserProject.isValidCurrentProject = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT current_project FROM `users` WHERE `user_id` =(?)", [user_id], (err, res) => {
      if (err) reject(false)

      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      resolve(res[0].current_project)
    })
  })
}


UserProject.getProjectlistByClientId = (client_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT  projects.project_id,projects.project_name FROM projects WHERE project_client_id=(?)", [client_id], (err, res) => {

      if (err) {
        reject(err); // Reject with the error object
      } else {

        resolve(res)
      }
    })
  })
}

//product table assign  update user (Adding) api
UserProject.getUserUpdate = (userProject) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT project_user_ids, project_id FROM projects WHERE project_id = ?", [userProject.project_id], (err, res) => {
      if (err) {
        reject(err);
      } else {
        let updating_project;
        if (res.length > 0) {
          updating_project = res[0];
        } else {
          updating_project = null; // or set it to a default value indicating no project was found
        }

        if (updating_project && userProject && userProject.user_id) {
          const oldUserIds = (updating_project.project_user_ids || '').split(',');
          const mergedUserIds = [userProject.user_id, ...oldUserIds].filter(Boolean); // Remove empty strings

          updating_project.project_user_ids = mergedUserIds.join(',');

          sql.query("UPDATE projects SET project_user_ids = ? WHERE project_id = ?", [updating_project.project_user_ids, updating_project.project_id], (error, resp) => {
            if (error) {
              reject(error);
            } else {
              resolve(resp);
            }
          });
        }
        else {
          resolve(); // No user_id or updating_project, resolve without updating
        }
      }
    });
  });
}


//product table unassign  update user (removing) api

UserProject.unAssignProjectToUser = (userProject) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT project_user_ids, project_id FROM projects WHERE project_id = ?", [userProject.project_id], (err, res) => {
      if (err) {
        reject(err);
      } else {
        let updating_project;
        if (res.length > 0) {
          updating_project = res[0];
        } else {
          updating_project = {
            project_user_ids: '',
            project_id: userProject.project_id
          };
        }

        if (userProject && userProject.user_id) {
          const oldUserIds = updating_project.project_user_ids.split(',');
          const removedUserIds = oldUserIds.filter(id => id !== userProject.user_id);

          updating_project.project_user_ids = removedUserIds.join(',');

          sql.query("UPDATE projects SET project_user_ids = ? WHERE project_id = ?", [updating_project.project_user_ids, updating_project.project_id], (error, resp) => {
            if (error) {
              reject(error);
            } else {
              // console.log(resp, "resp");
              resolve(resp);
            }
          });
        }
      }
    });
  });
}

//user_projects unassign update status api
UserProject.updateStatus = (userProject) => {
  // console.log(userProject, "userProject")
  return new Promise((resolve, reject) => {


    sql.query(`UPDATE user_projects SET status = (?) WHERE user_id =(?) AND project_id=(?)`, [userProject.status, userProject.user_id, userProject.project_id], (err, res) => {
      if (err) {
        reject(err)
        return;
      }
      resolve(res);
    })


  })
}

UserProject.updateInActiveStatus = (user_id, project_id) => {
  //  / console.log(userProject, "userProject")
  return new Promise((resolve, reject) => {


    sql.query(`UPDATE user_projects SET status = 'In-Active' WHERE user_id =(?) AND project_id=(?)`, [user_id, project_id], (err, res) => {
      if (err) {
        reject(err)
        return;
      }
      resolve(res);
    })


  })
}

UserProject.updateActiveStatus = (user_id, project_id) => {

  return new Promise((resolve, reject) => {
    sql.query(`UPDATE user_projects SET status = (?) WHERE user_id =(?) AND project_id=(?)`, ["Active", user_id, project_id], (err, res) => {
      if (err) {
        reject(err)
        return;
      }
      resolve(res);
    })


  })
}


//current_project or count  update 
UserProject.updateProjectCountIncrement = (userProject) => {
  return new Promise((resolve, reject) => {
    sql.query("UPDATE users SET current_project = current_project +1 WHERE user_id = ?", [userProject.user_id], (error, res1) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(res1);
    });
  })
}
//current_project or count  update 
UserProject.updateProjectCountDecrement = (userProject) => {
  return new Promise((resolve, reject) => {
    sql.query("UPDATE users SET current_project = current_project -1 WHERE user_id = ?", [userProject.user_id], (error, res1) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(res1);
    });
  })
}

UserProject.isValidRole = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT role FROM `users` WHERE `user_id` =(?)", [user_id], (err, res) => {
      if (err) reject(false)

      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      resolve(res[0].role)
    })
  })
}

UserProject.getManagerUpdate = (userProject) => {
  return new Promise((resolve, reject) => {
    sql.query("UPDATE projects SET project_manager_id = ? WHERE project_id = ?", [userProject.user_id, userProject.project_id], (error, resp) => {
      if (error) {
        reject(error);
      } else {
        // console.log(resp, "resp");
        resolve(resp);
      }
    });
    //updating user in project table
  })
}

//current_project or count  update 
UserProject.updateManagerProjectCountIncrement = (project_manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query("UPDATE users SET current_project = current_project +1 WHERE user_id = ?", [project_manager_id], (error, res1) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(res1);
    });
  })
}
//current_project or count  update for manager 
UserProject.updateManagerProjectCountDecrement = (project_manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query("UPDATE users SET current_project = current_project -1 WHERE user_id = ?", [project_manager_id], (error, res1) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(res1);
    });
  })
}

// //user_projects unassign update status for  manager api
// UserProject.updateManagerStatus = (status, user_id, project_id) => {
//   // console.log(userProject, "userProject")
//   return new Promise((resolve, reject) => {


//     sql.query(`UPDATE user_projects SET status = (?) WHERE user_id =(?) AND project_id=(?)`, [status, user_id, project_id], (err, res) => {
//       if (err) {
//         reject(err)
//         return;
//       }
//       resolve(res);
//     })


//   })
// }


UserProject.createManagerProject = (user_id, project_id) => {

  return new Promise((resolve, reject) => {
    sql.query("INSERT INTO user_projects (user_id, project_id, status) VALUES (?, ?, 'Active')", [user_id, project_id], (error, resp) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(resp);

    });
  })
}



UserProject.isUsersValidByuserId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT user_id FROM `user_projects` WHERE `user_id` IN (?)", [user_id], (err, res) => {
      if (err) reject(false)
      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      resolve(res.length)
    })
  })
}

UserProject.getUserByProject_id = (project_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT user_id FROM `user_projects` WHERE `project_id` IN (?)", [project_id], (err, res) => {
      if (err) reject(false)
      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      resolve(res.length)

    })
  })
}


UserProject.deleteUserProjectbyUserId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("DELETE FROM `user_projects` WHERE `user_id` IN (?)", [user_id], (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}
module.exports = UserProject;