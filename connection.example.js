const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'xxx.xxx.xxx.xxx',
  user: 'xxxxxxxx',
  password: '£££££££££££££',
  database: '**************',
  waitForConnections: true, // tunggu kalau semua koneksi sibuk
  connectionLimit: 10, // jumlah maksimal koneksi bersamaan
  queueLimit: 0, // 0 = unlimited antrean query
});
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Gagal terkoneksi ke database:', err.message);
  } else {
    console.log('✅ Terkoneksi ke database MySQL (pool).');
    conn.release(); // lepas kembali ke pool
  }
});

module.exports = pool;
