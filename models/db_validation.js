const sql = require("./db")
const DBValidation = {}

DBValidation.isClientIsValid = (client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM clients WHERE client_id=?", [client_id], (err, res)=> {
      if(err)reject(false)

      if(res.length === 0)resolve(false)
      resolve(true)
    })
  })
}

DBValidation.isProjectIsValid = (project_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM projects WHERE project_id=?", [project_id], (err, res)=> {
      if(err)reject(false)

      if(res.length === 0)resolve(false)
      resolve(true)
    })
  })
}

DBValidation.isProjectAndClientMatch = (project_id, client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM projects WHERE project_id=? AND project_client_id=?", [project_id, client_id], (err, res)=> {
      if(err)reject(false)

      if(res.length === 0)resolve(false)
      resolve(true)
    })
  })
}

DBValidation.isHisClient = (client_id, user) => {
  if(user.role === "admin"){
    return true;
  }else if(user.role === "manager"){
    return new Promise((resolve, reject)=> {
      sql.query("SELECT * FROM projects WHERE project_manager_id=?", [user.user_id], (err, res)=> {
        if(err)reject(false)
  
        const client_ids = res.map(e => e.project_client_id)
        if(res.length === 0)resolve(false)
        else{
          sql.query("SELECT * FROM clients WHERE client_id IN (?)", [client_ids], (err, res1)=> {
            if(err)reject(false)
            if(res1.length === 0)resolve(false)
            resolve(true)
          })
        }
      })
    })
  }else if(user.role === "user"){
    return new Promise((resolve, reject)=> {
      sql.query("SELECT * FROM projects", [], (err, res)=> {
        if(err)reject(false)
        let client_ids = [];
        const a = res.map(e => {
          const user_split = (e.project_user_ids).split(',')
          if(user_split.includes( user.user_id )){
            client_ids.push(e.project_client_id)
          }
        })
        if(res.length === 0)resolve(false)
        else{
          sql.query("SELECT * FROM clients WHERE client_id IN (?)", [client_ids], (err, res1)=> {
            if(err)reject(false)
            if(res1.length === 0)resolve(false)
            resolve(true)
          })
        }
      })
    })
  }
}


DBValidation.isHisProject = (project_id, user) => {
  if(user.role === "admin"){
    return true;
  }else if(user.role === "manager"){
    return new Promise((resolve, reject)=> {
      sql.query("SELECT * FROM projects WHERE project_id=? AND project_manager_id=?", [project_id,user.user_id], (err, res)=> {
        if(err)reject(false)
  
        if(res.length === 0)resolve(false)
        resolve(true)
      })
    })
  }else{
    return false;
  }
}

DBValidation.isHisNotification = (notif_id, user) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM notification WHERE notif_id=? AND to_id=?", [notif_id,user.user_id], (err, res)=> {
      if(err)reject(false)

      if(res.length === 0)resolve(false)
      resolve(true)
    })
  })
}

DBValidation.isHisTask = (task_id, user) => {
  if(user.role === "admin"){
    return true;
  }else if(user.role === "manager"){
    return new Promise((resolve, reject)=> {
      sql.query("SELECT * FROM tasks WHERE task_id=?", [task_id], (err, res)=> {
        if(err)reject(false)
  
        if(res.length === 0)resolve(false)
        else{
          sql.query("SELECT * FROM projects WHERE project_id=? AND project_manager_id=?", [res[0].project_id,user.user_id], (err, res1)=> {
            if(err)reject(false)
            if(res1.length === 0)resolve(false)
            resolve(true)
          })
        }
      })
    })
  }else if(user.role === "user"){
    return new Promise((resolve, reject)=> {
      sql.query("SELECT * FROM tasks WHERE task_id=? AND user_id=?", [task_id,user.user_id], (err, res)=> {
        if(err)reject(false)
  
        if(res.length === 0)resolve(false)
        resolve(true)
      })
    })
  }
}

DBValidation.isHeisBelongToProject = (project_id, user_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM projects WHERE project_id=?", [project_id], (err, res)=> {
      if(err)reject(false)
      if(res.length === 0)resolve(false)
      else{
        const check = res[0].project_user_ids+''.split(',')
        if(check.includes(user_id)){
          resolve(true)
        }else{
          resolve(false)
        }
      }
      resolve(true)
    })
  })
}

DBValidation.isHeisBelongToProjectWhileAdding = (project_id, user_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM projects WHERE project_id=?", [project_id], (err, res)=> {
      if(err)reject(false)
      if(res.length === 0)resolve(false)
      else{
        if(''+user_id.split('-')[0] === 'MNGR'){
          const check = res[0].project_manager_id
          if(check.includes(user_id)){
            resolve(true)
          }else{
            resolve(false)
          }
        }else{
          const check1 = res[0].project_user_ids+''.split(',')
          if(check1.includes(user_id)){
            resolve(true)
          }else{
            resolve(false)
          }
        }
      }
      resolve(true)
    })
  })
}


module.exports = DBValidation;