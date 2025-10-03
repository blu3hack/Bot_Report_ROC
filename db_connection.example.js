const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'xxx.xxx.xxx.xxx',
  user: 'xxxxxxxx',
  password: '£££££££££££££',
  database: '**************',
  dateStrings: true,
});
connection.connect();
module.exports = connection;
