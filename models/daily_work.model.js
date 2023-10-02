const sql = require("./db")

const DailyWork = function(daily_work) {
    this.work_task_id = daily_work.work_task_id
    this.hours_worked	 = daily_work.hours_worked	
    this.comment = daily_work.comment
    this.user_id = daily_work.user_id
    this.updated_by = daily_work.updated_by
};

DailyWork.create = (newDaily_work)=>{
  return new Promise((resolve, reject)=> {
    sql.query("INSERT INTO daily_works SET ?", newDaily_work, (err, res)=>{
        if (err) {
            reject(err)
            return;
          }

          const work_id = `WRK-${res.insertId}`
          sql.query("UPDATE daily_works SET work_id=? WHERE id=?", [work_id, res.insertId], (err, res1)=>{
            resolve({ ...newDaily_work });
            return
          })
      
    })
  })
}

 DailyWork.getAll = (work_id, work_task_id, hours_worked, comment, user_id, createdAt, perPage, pageNumber, searchKey) => {
  return new Promise((resolve, reject)=> {
    let query = `SELECT work_id, work_task_id, hours_worked, comment, daily_works.user_id, daily_works.createdAt, daily_works.modifiedAt,
    JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'user_avatar', users.avatar, 'userModified', users.modifiedAt) AS users
    FROM daily_works
    INNER JOIN users ON users.user_id = daily_works.updated_by
    WHERE 1=1`;
  
    if(searchKey){
      query += ` AND (createdAt LIKE '%${searchKey}%' OR work_id LIKE '%${searchKey}%' OR work_task_id LIKE '%${searchKey}%' OR hours_worked LIKE '%${searchKey}%' OR comment LIKE '%${searchKey}%' OR user_id LIKE '%${searchKey}%')`;
    }

    if (work_id) {
      query += ` AND work_id = '${work_id}'`;
    }

    if (createdAt) {
      query += ` AND daily_works.createdAt = '${createdAt}'`;
    }

    if (work_task_id) {
      query += ` AND work_task_id = '${work_task_id}'`;
    }
    
    if (hours_worked) {
      query += ` AND hours_worked = '${hours_worked}'`;
    }

    if (comment) {
      query += ` AND comment = '${comment}'`;
    }

    if (user_id) {
      query += ` AND user_id = '${user_id}'`;
    }

    query += ` ORDER BY daily_works.modifiedAt DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber-1)*perPage}, ${perPage}`;
    }
  
    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const data = res.map(e => { 
        const updated_by = JSON.parse(e.users)
        delete e.users
        Object.assign(e, {updated_by})
        return e
      })

      resolve(res);
      return
    });
  })
}

DailyWork.getDailyUpdate = (update_date) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM daily_works WHERE createdAt=?", update_date, (err, res)=> {
      if(err)reject(null)
      resolve(res)
    })
  })
}


DailyWork.getClientbyId = (task_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM daily_works WHERE work_task_id=?", task_id, (err, res)=> {
      if(err)reject(null)
      resolve(res[0])
    })
  })
}



DailyWork.getReport = (project_id, report_type, fdate, ldate)  => {
  return new Promise((resolve, reject)=> {

    let createdAt = ""
    if(report_type === "daily_report"){
      createdAt = "AND daily_works.createdAt = CURDATE()"
    }else if(report_type === "weekly_report"){
      const today = new Date();
      let first_date = new Date(today.setDate(today.getDate() - today.getDay()));
      let last_date = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      first_date = first_date.toISOString().split('T')[0]
      last_date = last_date.toISOString().split('T')[0]
      createdAt = `AND daily_works.createdAt >= DATE("${first_date}") AND daily_works.createdAt <= DATE("${last_date}")`
    }else if(report_type === "monthly_report"){
      let date = new Date()
      let first_date = new Date(date.getFullYear(), date.getMonth(), 1)
      first_date = first_date.toISOString().split('T')[0]
      let last_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      last_date = last_date.toISOString().split('T')[0]
      createdAt = `AND daily_works.createdAt >= DATE("${first_date}") AND daily_works.createdAt <= DATE("${last_date}")`
    }else if(report_type === "custom_report"){
      createdAt = `AND daily_works.createdAt >= DATE("${fdate}") AND daily_works.createdAt <= DATE("${ldate}")`
    }
      sql.query("SELECT * FROM tasks WHERE project_id IN (?)", [project_id], (err, res)=> {
        if(err)reject(null)
        const task_ids = res.map(e => e.task_id)

        sql.query(`SELECT comment,daily_works.createdAt, hours_worked,
        JSON_OBJECT('task_title',tasks.task_title, 'task_status', tasks.task_status, 'deadline', tasks.deadline) AS tasks,
        JSON_OBJECT('user_name',users.name) AS users,
        JSON_OBJECT('project_id',projects.project_id, 'project_name', projects.project_name) AS projects
        FROM daily_works 
        INNER JOIN tasks ON tasks.task_id = daily_works.work_task_id
        INNER JOIN users ON users.user_id = daily_works.user_id
        INNER JOIN projects ON projects.project_id = tasks.project_id
        WHERE work_task_id IN (?) ${createdAt} ORDER BY daily_works.user_id, daily_works.createdAt`, [task_ids], (err, res)=> {
          if(err)reject(null)
          
          if(res){
            const data = res.map(e => { 
              const tasks = JSON.parse(e.tasks)
              const users = JSON.parse(e.users)
              const projects = JSON.parse(e.projects)
              Object.assign(e, {tasks})
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
    
  })
}

DailyWork.getReportAll = (project_id, report_type, fdate, ldate, user_id)  => {
  return new Promise((resolve, reject)=> {

    let createdAt = ""
    if(report_type === "daily_report"){
      let first_date = new Date()
      first_date = first_date.toISOString().split('T')[0]
      createdAt = `AND daily_works.createdAt = DATE("${first_date}")`
    }else if(report_type === "weekly_report"){
      const today = new Date();
      let first_date = new Date(today.setDate(today.getDate() - today.getDay()));
      let last_date = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      first_date = first_date.toISOString().split('T')[0]
      last_date = last_date.toISOString().split('T')[0]
      createdAt = `AND daily_works.createdAt >= DATE("${first_date}") AND daily_works.createdAt <= DATE("${last_date}")`
    }else if(report_type === "monthly_report"){
      let date = new Date()
      let first_date = new Date(date.getFullYear(), date.getMonth(), 1)
      first_date = first_date.toISOString().split('T')[0]
      let last_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      last_date = last_date.toISOString().split('T')[0]
      createdAt = `AND daily_works.createdAt >= DATE("${first_date}") AND daily_works.createdAt <= DATE("${last_date}")`
    }else if(report_type === "custom_report"){
      createdAt = `AND daily_works.createdAt >= DATE("${fdate}") AND daily_works.createdAt <= DATE("${ldate}")`
    }

    let useridquery = ""
    if(user_id && user_id !== 'all'){
      useridquery = "daily_works.user_id = '"+user_id+"' AND "
    }


      sql.query("SELECT * FROM tasks WHERE project_id IN (?)", [project_id], (err, res)=> {
        if(err)reject(null)
        const task_ids = res.map(e => e.task_id)

        sql.query(`SELECT comment,daily_works.createdAt, hours_worked,
        JSON_OBJECT('task_title',tasks.task_title, 'task_status', tasks.task_status, 'deadline', tasks.deadline) AS tasks,
        JSON_OBJECT('user_name',users.name, 'user_id',users.user_id) AS users,
        JSON_OBJECT('project_id',projects.project_id, 'project_name', projects.project_name) AS projects
        FROM daily_works 
        INNER JOIN tasks ON tasks.task_id = daily_works.work_task_id
        INNER JOIN users ON users.user_id = daily_works.user_id
        INNER JOIN projects ON projects.project_id = tasks.project_id
        WHERE ${useridquery} daily_works.work_task_id IN (?) ${createdAt} ORDER BY daily_works.user_id, daily_works.createdAt`, [task_ids], (err, res)=> {
          if(err)reject(null)
        
          const data = res.map(e => { 
            const tasks = JSON.parse(e.tasks)
            const users = JSON.parse(e.users)
            const projects = JSON.parse(e.projects)
            Object.assign(e, {tasks})
            Object.assign(e, {users})
            Object.assign(e, {projects})
            return e
          })

          
          const data1 = res.reduce((t, cv, i, arr)=>{
            t[cv.projects.project_id] = cv.projects.project_id in t ? [...t[cv.projects.project_id], cv] : [cv];
            return t;
          },{})

          resolve(data1)
        })
      })


  })
}

module.exports = DailyWork;