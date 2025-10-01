const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '10.110.13.56',
  user: 'perf_roc',
  password: 'perf#roc',
  database: 'nonatero_download',
});
connection.connect();
module.exports = connection;
