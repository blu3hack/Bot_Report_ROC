const mysql = require('mysql');

// === KONFIG DATABASE ===
const pool = mysql.createPool({
  host: '10.110.13.43',
  user: 'cxmention',
  password: 'tr5ju4r4#',
  database: 'perf_tif',
  connectionLimit: 10,
});

// Fungsi ambil data
function getData() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT pesan FROM get_otp_for_download ORDER BY id DESC LIMIT 1'; // ambil 10 data terakhir
    pool.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Eksekusi
(async () => {
  try {
    const rows = await getData();
    console.log('✅ Data berhasil diambil:');
    console.table(rows); // tampil tabel di console
  } catch (err) {
    console.error('❌ Gagal ambil data:', err.message);
  } finally {
    pool.end(); // tutup koneksi pool
  }
})();
