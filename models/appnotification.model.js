const sql = require("./db.js");


// constructor
const APPNotification = function(notif) {
  this.from_id = notif.from_id
  this.from_role = notif.from_role
  this.to_id = notif.to_id
  this.to_role = notif.to_role
  this.notif_type = notif.notif_type
  this.message = notif.message
  this.action = notif.action || 'unseen'
};


APPNotification.create = (notif)=>{
  return new Promise((resolve, reject)=> {
    sql.query("INSERT INTO notification SET ?", notif, (err, res)=>{
        if (err) {
            reject(err)
            return;
          }
          
          let notif_id = `NOTIF-${res.insertId}`
          
          sql.query("UPDATE notification SET notif_id=? WHERE id=?", [notif_id, res.insertId], (err, res1)=>{
            resolve({ notif_id:notif_id,  notif });
            return
          })
    })
  })
}


APPNotification.getAll = (host_url, notif_id, from_id, to_id, from_role, to_role, notif_type, message, action, perPage, pageNumber, searchKey) => {
  return new Promise((resolve, reject)=> {
    let query = `SELECT notif_id, from_id, to_id, from_role, to_role, notif_type, message, action, notification.modifiedAt, users.modifiedAt as date_time_modified, JSON_OBJECT('user_email', users.email, 'user_name', users.name, 'avatar', users.avatar) AS users FROM notification INNER JOIN users ON users.user_id = notification.from_id WHERE 1=1 `;

    if(searchKey){
      query += ` AND (notif_id LIKE '%${searchKey}%' OR from_id LIKE '%${searchKey}%' OR to_id LIKE '%${searchKey}%' OR from_role LIKE '%${searchKey}%' OR to_role LIKE '%${searchKey}%' OR notif_type LIKE '%${searchKey}%' OR message LIKE '%${searchKey}%' OR action LIKE '%${searchKey}%')`;
    }

    if (notif_type) {
      query += ` AND notif_type = '${notif_type}'`;
    }

    if (message) {
      query += ` AND message = '${message}'`;
    }

    if (action) {
      query += ` AND action = '${action}'`;
    }

    if (notif_id) {
      query += ` AND notif_id = '${notif_id}'`;
    }

    if (from_id) {
      query += ` AND from_id = '${from_id}'`;
    }
    
    if (to_id) {
      query += ` AND to_id = '${to_id}'`;
    }

    if (from_role) {
      query += ` AND from_role = '${from_role}'`;
    }

    if (to_role) {
      query += ` AND to_role = '${to_role}'`;
    }

    query += ` ORDER BY notification.modifiedAt DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber-1)*perPage}, ${perPage}`;
    }
  
    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const data = res.map(e => { 
        let users = JSON.parse(e.users)
        users = {...users, avatar: (users.avatar!==""? encodeURI(host_url +''+ users.avatar):"")}
        Object.assign(e, {users})

        return e
      })

      resolve(res);
      return
    });
  })
}

APPNotification.allTypeWise = (to_id, host) => {
  return new Promise((resolve, reject)=> {
    sql.query(`SELECT notification.id, notif_id, from_id, to_id, from_role, to_role, notif_type, message, action, notification.createdAt, notification.modifiedAt,
    JSON_OBJECT('user_email', users.email, 'user_id', users.user_id, 'user_name', users.name, 'user_avatar', users.avatar) AS users
    FROM notification
    INNER JOIN users ON users.user_id = notification.from_id
    WHERE to_id=? ORDER BY notif_type, createdAt`, [to_id, 'unseen'], (err, res)=> {
      if(err)reject(null)

      if(res) {
        const data = res.map(e => { 
          const users = JSON.parse(e.users)
          Object.assign(e, {users})
          return e
        })

        res = res.map(e => {
          e.users.user_avatar = e.users.user_avatar === "" ? "" : encodeURI(host + e.users.user_avatar)
          return e
        })
        resolve(res)
        return
      }else{
        resolve([])
      }
    })
  })
}


APPNotification.checkActiveNotification = (to_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM notification WHERE to_id=? AND action = ?", [to_id, 'unseen'], (err, res)=> {
      if(err)reject(null)

      if(res.length === 0) {
        resolve(0)
        return
      }
      else resolve(res.length)
    })
  })
}

APPNotification.getNotifbyId = (notif_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM notification WHERE notif_id=?", notif_id, (err, res)=> {
      if(err)reject(null)
      resolve(res[0])
    })
  })
}

APPNotification.update = (action, notif_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`UPDATE notification SET action = ? WHERE notif_id = ?`, [action, notif_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

APPNotification.seenNotification = (to_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`UPDATE notification SET action = ? WHERE to_id = ?`, ['seen', to_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

APPNotification.deleteNotificationById = (notif_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`DELETE FROM notification WHERE notif_id IN (?)`, [notif_id], (err, res)=> {
      if(err)reject(null)
      resolve(res)
    })
  })
}



  module.exports = APPNotification;