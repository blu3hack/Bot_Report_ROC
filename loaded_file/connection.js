const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '10.110.13.43',
  user: 'cxmention',
  password: 'tr5ju4r4#',
  database: 'perf_tif',
});
connection.connect();
module.exports = connection;
