
const sql = require("./db")
const Common = {}

Common.getOrderNumberOrInvoice = () => {
    return new Promise((resolve, reject) => {
        sql.query('SELECT * FROM common', [], (err, res)=> {
            if(err){
                reject(0)
                return
            }
           
            const id= res[0].id
            let order_number = res[0].order_number

            order_number++;
            sql.query(`UPDATE common SET order_number=${order_number} WHERE id=${id}`)
            resolve(order_number)
            return
        })
    })
}

Common.getAllStateAndCity = () => {
    return new Promise((resolve, reject)=> {
      sql.query("SELECT state, city FROM city ORDER BY state, city", (err, res)=> {
        if(err)reject(null)
        resolve(res)
      })
    })
  };


  Common.getAllState = () => {
    return new Promise((resolve, reject)=> {
      sql.query("SELECT state FROM city GROUP BY state  ORDER BY state", (err, res)=> {
        if(err)reject(null)
        resolve(res)
      })
    })
  };

  Common.getCitiesbyState = (state) => {
    return new Promise((resolve, reject)=> {
      sql.query("SELECT city FROM city WHERE state=? GROUP BY `city` ORDER BY city", state , (err, res)=> {
        if(err)reject(null)
        resolve(res)
      })
    })
  };

module.exports = Common