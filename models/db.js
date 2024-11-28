// const mysql = require('mysql2');

// const connection = mysql.createConnection({
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'admin',
//   database: 'socialdb'
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('MySQL Connection Error:', err.message);
//     return;
//   }
//   console.log('Connected to MySQL successfully!');
// });



// host: dbConfig.HOST,
// user: dbConfig.USER,
// password: dbConfig.PASSWORD,
// database: dbConfig.DB


const mysql = require("mysql");
const dbConfig = require("../config/db.config.js");

var connection = mysql.createPool({
  timezone: 'utc',
  dateStrings: [
    'DATE',
    'DATETIME'
  ],
  host: '127.0.0.1',
  user: 'root',
  password: 'admin',
  database: 'socialdb'
});



connection.getConnection((err, conn) => {
  if (err) console.log('MySql DB not connected');
  if(conn) console.log('Connected to the MySql DB');
});


module.exports = connection;
