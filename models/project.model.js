const sql = require("./db")

const Project = function (project) {
  this.project_name = project.name
  this.project_description = project.description
  this.project_status = project.status
  this.project_start_date = project.project_start_date
  this.project_end_date = project.project_end_date
  this.project_manager_id = project.project_manager_id
  this.project_user_ids = project.project_user_ids
  this.project_client_id = project.project_client_id
  this.completed_date_time = project.completed_date_time
  this.project_type = project.project_type
};

Project.create = (newProject) => {
  return new Promise((resolve, reject) => {
    sql.query("INSERT INTO projects SET ?", newProject, (err, res) => {
      if (err) {
        reject(err)
        return;
      }

      const project_id = `PROJ-${res.insertId}`


      // console.log(newProject.project_manager_id, project_id, "testing")

      sql.query("INSERT INTO user_projects (user_id, project_id, status) VALUES (?, ?, 'Active')", [newProject.project_manager_id, project_id], (error, resp) => {
        if (error) {
          reject(error);
          return;
        }
        // console.log(resp, "manager add in user project table and increment by 1 in user table");
      });
      sql.query("UPDATE projects SET project_id=? WHERE id=?", [project_id, res.insertId], (err, res1) => {
        resolve({ project_id: project_id, ...newProject });
        return
      })
    })

  })

}


// Project.createUserProject = (newProject) => {
//   return new Promise((resolve, reject) => {
//     sql.query("INSERT INTO user_projects  (user_id, project_id, status) VALUES ('?','?','Active')", newProject.project_manager_id, newProject.project_id, (error, resp) => {
//       if (error) {
//         reject(error)
//         return;
//       }
//       console.log(resp, "manager add in user project table and increment by 1 in user table")
//       resolve(resp);
//     })

//   })
// }


Project.getAll = (user, project_id, project_name, project_status, project_start_date, project_end_date, project_client_id, perPage, pageNumber, searchKey) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT projects.project_id, projects.project_client_id ,projects.project_name ,projects.project_description ,projects.project_status ,projects.project_start_date ,projects.project_end_date ,projects.completed_date_time ,projects.project_manager_id ,projects.project_user_ids ,projects.project_date_created ,projects.project_date_modified , projects.project_type,
    JSON_OBJECT('user_email', users.email, 'user_id', users.user_id, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('client_name', clients.client_name, 'client_id', clients.client_id, 'client_email', clients.client_email) AS clients
    FROM projects 
    INNER JOIN users ON users.user_id = projects.project_manager_id
    INNER JOIN clients ON clients.client_id = projects.project_client_id
    WHERE 1=1 `;

    if (user.role === "manager") {
      query += ` AND project_manager_id = '${user.user_id}'`;
    }

    if (searchKey) {
      query += ` AND (project_client_id LIKE '%${searchKey}%' OR project_id LIKE '%${searchKey}%' OR project_name LIKE '%${searchKey}%' OR project_status LIKE '%${searchKey}%' OR project_start_date LIKE '%${searchKey}%' OR project_end_date LIKE '%${searchKey}%')`;
    }

    if (project_client_id) {
      query += ` AND project_client_id = '${project_client_id}'`;
    }

    if (project_status) {
      query += ` AND project_status = '${project_status}'`;
    }

    if (project_id) {
      query += ` AND project_id = '${project_id}'`;
    }

    if (project_name) {
      query += ` AND project_name = '${project_name}'`;
    }

    if (project_start_date) {
      query += ` AND project_start_date >= '${project_start_date}'`;
    }

    if (project_end_date) {
      query += ` AND project_end_date <= '${project_end_date}'`;
    }

    query += ` ORDER BY project_date_modified DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber - 1) * perPage}, ${perPage}`;
    }

    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const data = res.map(e => {
        const manager = JSON.parse(e.users)
        const clients = JSON.parse(e.clients)
        delete e.users
        Object.assign(e, { manager })
        Object.assign(e, { clients })
        return e
      })

      resolve(data);
      return
    });
  })
}

Project.update = (obj, project_id) => {
  return new Promise((resolve, reject) => {
    sql.query(`UPDATE projects SET ? WHERE project_id = ?`, [obj, project_id], (err, res) => {
      if (err) {
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

Project.getProjectbyId = (project_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects WHERE project_id=?", project_id, (err, res) => {
      if (err) reject(null)
      resolve(res[0])
    })
  })
}

Project.getProjectsbyClientId = (client_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects WHERE project_client_id IN (?)", [client_id], (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}

Project.getClientProjectsbyManagerId = (manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects WHERE project_manager_id=? group by project_client_id", manager_id, (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}

Project.getProjectsbyManagerId = (manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects WHERE project_manager_id=?", manager_id, (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}

Project.getProjectsbyAdmin = () => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects", null, (err, res) => {
      if (err) reject(null)
      if (res) {
        resolve(res)
      } else {
        resolve([])
      }
    })
  })
}

Project.getAllForAdmin = () => {
  return new Promise((resolve, reject) => {
    let query = `SELECT projects.project_id, projects.project_client_id ,projects.project_name ,projects.project_description ,projects.project_status ,projects.project_start_date ,projects.project_end_date ,projects.completed_date_time ,projects.project_manager_id ,projects.project_user_ids ,projects.project_date_created ,projects.project_date_modified ,projects.project_type,
    JSON_OBJECT('user_email', users.email, 'user_id', users.user_id, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('client_name', clients.client_name, 'client_id', clients.client_id, 'client_email', clients.client_email) AS clients
    FROM projects 
    INNER JOIN users ON users.user_id = projects.project_manager_id
    INNER JOIN clients ON clients.client_id = projects.project_client_id
    WHERE 1=1`;

    query += ` ORDER BY project_date_modified DESC`;

    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      if (res) {
        const data = res.map(e => {
          const manager = JSON.parse(e.users)
          const clients = JSON.parse(e.clients)
          delete e.users
          Object.assign(e, { manager })
          Object.assign(e, { clients })
          return e
        })
        resolve(data);
        return
      } else {
        resolve([]);
      }

    });
  })
}

Project.getAllForManager = (manager_id) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT projects.project_id, projects.project_client_id ,projects.project_name ,projects.project_description ,projects.project_status ,projects.project_start_date ,projects.project_end_date ,projects.completed_date_time ,projects.project_manager_id ,projects.project_user_ids ,projects.project_date_created ,projects.project_date_modified ,projects.project_type,
    JSON_OBJECT('user_email', users.email, 'user_id', users.user_id, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('client_name', clients.client_name, 'client_id', clients.client_id, 'client_email', clients.client_email) AS clients
    FROM projects 
    INNER JOIN users ON users.user_id = projects.project_manager_id
    INNER JOIN clients ON clients.client_id = projects.project_client_id
    WHERE project_manager_id=?`;

    query += ` ORDER BY project_date_modified DESC`;

    sql.query(query, manager_id, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      if (res) {
        const data = res.map(e => {
          const manager = JSON.parse(e.users)
          const clients = JSON.parse(e.clients)
          delete e.users
          Object.assign(e, { manager })
          Object.assign(e, { clients })
          return e
        })
        resolve(data);
        return
      } else {
        resolve([]);
      }

    });
  })
}

Project.getProjectsInfobyUserId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT projects.project_id, projects.project_client_id ,projects.project_name ,projects.project_description ,projects.project_status ,projects.project_start_date ,projects.project_end_date ,projects.completed_date_time ,projects.project_manager_id ,projects.project_user_ids ,projects.project_date_created ,projects.project_date_modified ,projects.project_type,
    JSON_OBJECT('user_email', users.email, 'user_id', users.user_id, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('client_name', clients.client_name, 'client_id', clients.client_id, 'client_email', clients.client_email) AS clients
    FROM projects 
    INNER JOIN users ON users.user_id = projects.project_manager_id
    INNER JOIN clients ON clients.client_id = projects.project_client_id
    WHERE 1=1`, null, (err, res) => {
      if (err) reject(null)

      if (res) {
        const data = res.map(e => {
          const manager = JSON.parse(e.users)
          const clients = JSON.parse(e.clients)
          delete e.users
          Object.assign(e, { manager })
          Object.assign(e, { clients })
          return e
        })

        res = res.filter(e => {
          const temp = e.project_user_ids + ''.split(',').filter(k => k === user_id)
          if (temp.length > 0) {
            return e
          }
        })
        resolve(res)
        return
      } else {
        resolve([]);
      }
    })
  })
}

Project.getProjectsbyUserId = (user_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM projects", null, (err, res) => {
      if (err) reject(null)

      res = res.filter(e => {
        const temp = e.project_user_ids + ''.split(',').filter(k => k === user_id)
        // const found = e.project_user_ids+''.split(',').find(element => element=== user_id);
        // console.log(found,"found")
        if (temp.length > 0) {
          return e
        }
      })
      resolve(res)
    })
  })
}

Project.deleteProjectbyId = (project_id) => {
  return new Promise((resolve, reject) => {
    sql.query(`DELETE FROM projects WHERE project_id IN (?)`, [project_id], (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}

Project.deleteProjectbyClientId = (client_id) => {
  return new Promise((resolve, reject) => {
    sql.query(`DELETE FROM projects WHERE project_client_id IN (?)`, [client_id], (err, res) => {
      if (err) reject(null)
      resolve(res)
    })
  })
}

Project.getTodayDeadlineProject = () => {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM projects WHERE project_end_date = CURDATE()`, [], (err, res) => {
      if (err) reject(null)

      sql.query(`SELECT * FROM projects WHERE project_end_date = CURDATE()`, [], (err, res) => {
        if (err) reject(null)

        resolve(res)
      })
    })
  })
}

Project.getAllDeadlines = (user) => {
  return new Promise((resolve, reject) => {
    if (user.role === "admin") {
      sql.query(`SELECT * FROM projects WHERE completed_date_time IS NULL`, [], (err, res) => {
        if (err) reject(null)

        resolve(res)
      })
    } else if (user.role === "manager") {
      sql.query(`SELECT * FROM projects WHERE project_manager_id = ? AND (completed_date_time IS NULL)`, [user.user_id], (err, res) => {
        if (err) reject(null)

        resolve(res)
      })
    }
  })
}

Project.getProjectManager_ByProject_id = (project_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT project_manager_id FROM projects WHERE project_id=?", project_id, (err, res) => {
      if (err) reject(null)
      resolve(res[0].project_manager_id)
    })
  })
}

Project.projectCountByManagerId = (manager_id) => {
  return new Promise((resolve, reject) => {
    sql.query("SELECT projects.project_id FROM projects WHERE `project_manager_id` IN (?)", [manager_id], (err, res) => {
      if (err) reject(false)
      if (res === undefined || res.length === 0) {
        resolve(false)
        return
      }
      resolve(res.length)

    })
  })
}

module.exports = Project;