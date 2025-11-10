const mysql = require('mysql2');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Hapus data lama berdasarkan tanggal
function deleteExistingData(callback) {
  const tableForDelete = ['unspec_hsi'];
  const currentDate = insertDate;

  let done = 0;
  tableForDelete.forEach((table) => {
    const sql = `DELETE FROM ${table} WHERE tgl = ?`;
    connection.query(sql, [currentDate], (err) => {
      if (err) {
        console.error(`❌ Error deleting data from ${table}:`, err);
      } else {
        console.log(`🗑️ Data lama dihapus dari tabel ${table}`);
      }

      done++;
      if (done === tableForDelete.length && callback) {
        callback(); // lanjut ke langkah berikutnya
      }
    });
  });
}

// Fungsi utama
function prosesUnspecDatin(jenis, area, callback) {
  const query = `
    SELECT
      sc_lokasi.witel AS witel,
      list_hsi.comply AS list_hsi,
      tiket_open_hsi.comply AS tiket_open_hsi
    FROM sc_lokasi
    LEFT JOIN list_hsi 
      ON sc_lokasi.witel = list_hsi.regional 
      AND list_hsi.tgl = '${insertDate}'
      AND list_hsi.jenis = '${jenis}'
    LEFT JOIN tiket_open_hsi
      ON sc_lokasi.witel = tiket_open_hsi.regional 
      AND tiket_open_hsi.tgl = '${insertDate}'
      AND tiket_open_hsi.jenis = '${jenis}'
    WHERE sc_lokasi.reg = '${area}'
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Terjadi kesalahan saat menjalankan query:', err);
      if (callback) callback();
      return;
    }

    const insertValues = [];

    results.forEach((row) => {
      const list_datin = parseFloat(row.list_hsi) || 0;
      const list_open = parseFloat(row.tiket_open_hsi) || 0;
      const unspec_datin = list_datin > 0 ? ((list_datin - list_open) / list_datin) * 100 : 0;
      insertValues.push([insertDate, jenis, row.witel, list_datin, list_open, unspec_datin.toFixed(2)]);
    });

    if (insertValues.length === 0) {
      console.log('⚠️ Tidak ada data untuk diinsert.');
      if (callback) callback();
      return;
    }

    const insertQuery = `
      INSERT INTO unspec_hsi (tgl, jenis, regional, list_datin, list_open, comply)
      VALUES ?
    `;

    connection.query(insertQuery, [insertValues], (err) => {
      if (err) {
        console.error('❌ Gagal melakukan insert:', err);
      } else {
        console.log(`✅ Berhasil insert ${insertValues.length} baris ke tabel unspec_hsi`);
      }
      if (callback) callback();
    });
  });
}

// Jalankan berurutan
deleteExistingData(() => {
  prosesUnspecDatin('tif', 'tif', () => {
    prosesUnspecDatin('tif', 'district', () => {
      prosesUnspecDatin('reg', 'nas', () => {
        prosesUnspecDatin('reg', 'witel', () => {
          connection.end(); // ✅ Tutup koneksi setelah semua selesai
          console.log('🔒 Semua proses selesai, koneksi ditutup.');
        });
      });
    });
  });
});
