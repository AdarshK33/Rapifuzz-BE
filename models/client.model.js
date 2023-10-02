const sql = require("./db")

const Client = function(client) {
    this.client_name = client.name
    this.client_address	 = client.address	
    this.client_email = client.email
    this.client_contact = client.contact
    this.client_status = client.status
};

Client.create = (newClient)=>{
  return new Promise((resolve, reject)=> {
    sql.query("INSERT INTO clients SET ?", newClient, (err, res)=>{
        if (err) {
            reject(err)
            return;
          }

          const client_id = `CLNT-${res.insertId}`
          sql.query("UPDATE clients SET client_id=? WHERE id=?", [client_id, res.insertId], (err, res1)=>{
            resolve({ ...newClient });
            return
          })
      
    })
  })
}

Client.getAll = (client_id, name, email, contact, status, perPage, pageNumber, searchKey) => {
  return new Promise((resolve, reject)=> {
    let query = "SELECT * FROM clients WHERE 1=1 ";
  
    if(searchKey){
      query += ` AND (client_status LIKE '%${searchKey}%' OR client_id LIKE '%${searchKey}%' OR client_email LIKE '%${searchKey}%' OR client_name LIKE '%${searchKey}%' OR client_contact LIKE '%${searchKey}%')`;
    }
    if (status) {
      query += ` AND client_status = '${status}'`;
    }

    if (client_id) {
      query += ` AND client_id = '${client_id}'`;
    }
    
    if (email) {
      query += ` AND client_email = '${email}'`;
    }

    if (name) {
      query += ` AND client_name = '${name}'`;
    }

    if (contact) {
      query += ` AND client_contact = '${contact}'`;
    }

    query += ` ORDER BY modifiedAt DESC`;

    if (pageNumber && perPage) {
      query += ` LIMIT ${(pageNumber-1)*perPage}, ${perPage}`;
    }
  
    sql.query(query, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
      return
    });
  })
}

Client.update = (obj, client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`UPDATE clients SET ? WHERE client_id = ?`, [obj, client_id], (err, res)=> {
      if(err){
        reject(err)
        return
      }
      resolve(res)
      return
    })
  })
}

Client.getClientsbyAdmin = () => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM clients", null, (err, res)=> {
      if(err)reject(null)
      if(res){
        resolve(res)
      }else{
        resolve([])
      }
    })
  })
}

Client.getClientbyId = (client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM clients WHERE client_id=?", client_id, (err, res)=> {
      if(err)reject(null)
      resolve(res[0])
    })
  })
}

Client.getManagerClient = (manager_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT client_id FROM `projects` WHERE `project_manager_id` IN (?)", [manager_id], (err, res)=> {
      if(err)reject(false)
      
      resolve("sdsd")
    })
  })
}

Client.isClientIsValid = (client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query("SELECT * FROM clients WHERE client_id=?", [client_id], (err, res)=> {
      if(err)reject(false)

      if(res.length === 0)resolve(false)
      resolve(true)
    })
  })
}



Client.deleteClient = (client_id) => {
  return new Promise((resolve, reject)=> {
    sql.query(`DELETE FROM clients WHERE client_id IN (?)`, [client_id], (err, res)=> {
      if(err)reject(null)
      resolve(res)
    })
  })
}

module.exports = Client;