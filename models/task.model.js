const sql = require("./db")

const Task = function(task) {
    this.project_id = task.project_id
    this.task_id	 = task.task_id	
    this.task_title = task.task_title
    this.description = task.description
    this.task_status = task.task_status
    this.start_date_time = task.start_date_time
    this.deadline = task.deadline
    this.user_note = task.user_note
    this.user_id = task.user_id
    this.completed_date_time = task.completed_date_time
};

Task.create = (newTask)=>{
  return new Promise((resolve, reject)=> {
    sql.query("INSERT INTO tasks SET ?", newTask, (err, res)=>{
        if (err) {
            reject(err)
            return;
          }

          const task_id = `TASK-${res.insertId}`
          sql.query("UPDATE tasks SET task_id=? WHERE id=?", [task_id, res.insertId], (err, res1)=>{
            resolve({ ...newTask });
            return
          })
      
    })
  })
}

Task.getAll = (project_id, task_id,task_title, task_status, deadline, start_date_time, user_id, perPage, pageNumber, searchKey) => {

  return new Promise((resolve, reject)=> {
    let query = `SELECT tasks.id, tasks.task_id, tasks.task_status, tasks.deadline, tasks.createdAt as taskCreated, tasks.description,tasks.modifiedAt as tasks_modif, tasks.project_id as taskProjID, tasks.start_date_time as taskStartTime, tasks.task_title, tasks.user_id as tasksUserID,tasks.user_note,
    JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('project_name', project_name) AS projects 
    FROM tasks 
    INNER JOIN users ON users.user_id = tasks.user_id
    INNER JOIN projects ON projects.project_id=tasks.project_id 
    WHERE 1=1 `;
  
    if(searchKey){
      query += ` AND (tasks.project_id LIKE '%${searchKey}%' OR task_id LIKE '%${searchKey}%' OR task_title LIKE '%${searchKey}%' OR task_status LIKE '%${searchKey}%' OR deadline LIKE '%${searchKey}%' OR start_date_time LIKE '%${searchKey}%' OR tasks.user_id LIKE '%${searchKey}%')`;
    }
    if (start_date_time) {
      query += ` AND start_date_time = '${start_date_time}'`;
    }

    if (user_id) {
      query += ` AND tasks.user_id = '${user_id}'`;
    }
    
    if (project_id) {
      query += ` AND tasks.project_id = '${project_id}'`;
    }

    if (task_id) {
      query += ` AND task_id = '${task_id}'`;
    }
    
    if (task_title) {
      query += ` AND task_title = '${task_title}'`;
    }

    if (task_status) {
      query += ` AND task_status = '${task_status}'`;
    }

    if (deadline) {
      query += ` AND deadline = '${deadline}'`;
    }

    query += ` ORDER BY tasks.modifiedAt DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber-1)*perPage}, ${perPage}`;
    }
  
    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const data = res.map(e => { 
        const users = JSON.parse(e.users)
        const projects = JSON.parse(e.projects)
        Object.assign(e, {users})
        Object.assign(e, {projects})
        return e
      })

      resolve(res);
      return
    });
  })
}

 Task.update = (obj, task_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`UPDATE tasks SET ? WHERE task_id = ?`, [obj, task_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
 }


Task.getTaskbyID = (task_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`SELECT tasks.id, tasks.project_id , tasks.user_id as task_user_id , tasks.task_title ,tasks.start_date_time , tasks.deadline , tasks.completed_date_time , tasks.description , tasks.user_note , tasks.task_status , tasks.createdAt, tasks.modifiedAt,
    JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('project_name', projects.project_name) AS projects
    FROM tasks 
    INNER JOIN users ON users.user_id = tasks.user_id
    INNER JOIN projects ON projects.project_id = tasks.project_id
    WHERE tasks.task_id=?`, task_id, (err, res)=> {
      if(err)reject(null)

      const data = res.map(e => { 
        const users = JSON.parse(e.users)
        const projects = JSON.parse(e.projects)
        Object.assign(e, {users})
        Object.assign(e, {projects})
        return e
      })

      resolve(res[0])
    })
  })
}

Task.getTaskInfobyProjectsIDs = (project_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`SELECT tasks.id, tasks.project_id , tasks.user_id as task_user_id , tasks.task_title ,tasks.start_date_time , tasks.deadline , tasks.completed_date_time , tasks.description , tasks.user_note , tasks.task_status , tasks.createdAt, tasks.modifiedAt,
    JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('project_name', projects.project_name) AS projects
    FROM tasks 
    INNER JOIN users ON users.user_id = tasks.user_id
    INNER JOIN projects ON projects.project_id = tasks.project_id
    WHERE tasks.project_id IN (?)`, [project_id], (err, res)=> {
      if(err)reject(null)

      const data = res.map(e => { 
        const users = JSON.parse(e.users)
        const projects = JSON.parse(e.projects)
        Object.assign(e, {users})
        Object.assign(e, {projects})
        return e
      })

      resolve(res)
    })
  })
}

Task.getTaskInfoforUserbyProjectsIDs = (project_id, user_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`SELECT tasks.id, tasks.project_id , tasks.user_id as task_user_id , tasks.task_title ,tasks.start_date_time , tasks.deadline , tasks.completed_date_time , tasks.description , tasks.user_note , tasks.task_status , tasks.createdAt, tasks.modifiedAt,
    JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
    JSON_OBJECT('project_name', projects.project_name) AS projects
    FROM tasks 
    INNER JOIN users ON users.user_id = tasks.user_id
    INNER JOIN projects ON projects.project_id = tasks.project_id
    WHERE tasks.user_id = '${user_id}' AND tasks.project_id IN (?)`, [project_id], (err, res)=> {
      if(err)reject(null)

      if(res){
        const data = res.map(e => { 
          const users = JSON.parse(e.users)
          const projects = JSON.parse(e.projects)
          Object.assign(e, {users})
          Object.assign(e, {projects})
          return e
        })
        resolve(res)
      }else{
        resolve([])
      }

    })
  })
}


Task.getTaskbyUserId = (user_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM tasks WHERE user_id=?", user_id, (err, res)=> {
      if(err)reject(null)
      resolve(res)
    })
  })
}


Task.getTaskbyManagerId = (manager_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM projects WHERE project_manager_id=?", manager_id, (err, res)=> {
      if(err)reject(null)
      const proj_id = res.map(e =>  e.project_id)
      sql.query("SELECT * FROM tasks WHERE project_id IN (?)", [proj_id], (err, res1)=> {
        if(err)reject(false)

        if(res1.length === 0)resolve([])
        resolve(res1)
      })
    })
  })
}

Task.delete = (task_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`DELETE FROM tasks WHERE task_id = ?`, [task_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

Task.getTasksbyAdmin = () => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM tasks", null, (err, res)=> {
      if(err)reject(null)
      if(res){
        resolve(res)
      }else{
        resolve([])
      }
    })
  })
}
// Task.getTaskbyID = (task_id) => {
//   return new Promise((resolve, reject)=> {
//     sql.query(`SELECT tasks.id, tasks.project_id , tasks.user_id as task_user_id , tasks.task_title ,tasks.start_date_time , tasks.deadline , tasks.completed_date_time , tasks.description , tasks.user_note , tasks.task_status , tasks.createdAt, tasks.modifiedAt,
//     JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users,
//     JSON_OBJECT('project_name', projects.project_name) AS projects
//     FROM tasks 
//     INNER JOIN users ON users.user_id = tasks.user_id
//     INNER JOIN projects ON projects.project_id = tasks.project_id
//     WHERE tasks.task_id=?`, task_id, (err, res)=> {
//       if(err)reject(null)

//       const data = res.map(e => { 
//         const users = JSON.parse(e.users)
//         const projects = JSON.parse(e.projects)
//         Object.assign(e, {users})
//         Object.assign(e, {projects})
//         return e
//       })

//       resolve(res[0])
//     })
//   })
// }

Task.deleteByProjectId = (project_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`DELETE FROM tasks WHERE project_id IN (?)`, [project_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

module.exports = Task;