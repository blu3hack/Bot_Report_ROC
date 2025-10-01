const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Hapus data dengan tanggal hari ini
function deleteExistingData() {
  const tableForDelete = ['msa'];
  const currentDate = insertDate;

  tableForDelete.forEach((table) => {
    const sql = `DELETE FROM ${table} WHERE insert_at = ?`;
    connection.query(sql, [currentDate], (err) => {
      if (err) {
        console.error(`Error deleting data from ${table}:`, err);
      }
    });
  });
}

// Baca CSV dan insert ke database
function inputDataToDatabase(kpi, file, insertToTable, lokasi) {
  const filePath = path.join(__dirname, 'msa_upload', `${file}.csv`);
  const currentDate = insertDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      const tgl = currentDate;

      const kpi_header = ['sugar_datin', 'sugar_wifi', 'sugar_hsi'];

      let area = data[Object.keys(data)[0]] || '';
      let sugar_datin = data[Object.keys(data)[1]] || '';

      const query = `INSERT INTO ${insertToTable} (kpi, lokasi, area, realisasi, insert_at, bulan) VALUES (?, ?, ?, ?, ?, ?)`;
      connection.query(query, [kpi, lokasi, area, sugar_datin, tgl, 9], (err) => {
        if (err) {
          console.error('Error inserting data:', err);
        }
      });
    })
    .on('end', () => {
      console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
      deleteUnwantedRows(insertToTable);
    })
    .on('error', (err) => {
      console.error('Gagal membuka file CSV:', err);
    });
}

// Hapus baris TOTAL atau kosong
function deleteUnwantedRows(table) {
  const deleteWitelValues = ['TOTAL', ''];
  deleteWitelValues.forEach((value) => {
    const sql = `DELETE FROM ${table} WHERE lokasi = ?`;
    connection.query(sql, [value], (err) => {
      if (err) {
        console.error(`Error deleting ${value} from ${table}:`, err);
      }
    });
  });
}

// Eksekusi seluruh proses
deleteExistingData();
inputDataToDatabase('ASR-ENT-Assurance Guarantee DATIN', 'tif', 'msa', 'tif');

// Tutup koneksi DB setelah semua proses selesai
setTimeout(() => {
  connection.end();
}, 50);
