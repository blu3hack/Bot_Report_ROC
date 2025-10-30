const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['unspec_datin'];
  const currentDate = insertDate;

  tableForDelete.forEach((table) => {
    const sql = `DELETE FROM ${table} WHERE tgl = ?`;
    connection.query(sql, [currentDate], (err, results) => {
      if (err) {
        console.error(`Error deleting data from ${table}:`, err);
      }
    });
  });
}

// Fungsi untuk memasukkan data dari CSV ke database
function inputDataToDatabase(file, insertToTable, jenis) {
  const filePath = path.join(__dirname, 'unspec_datin', `${file}.csv`);

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ',', headers: false }))
    .on('data', (data) => {
      const tgl = insertDate;
      const witel = data[Object.keys(data)[0]] || '';

      let real = '';
      real = data[Object.keys(data)[11]] || '';

      let newWitel = '';

      const query = `INSERT INTO ${insertToTable} (tgl, jenis, regional, comply) VALUES (?, ?, ?, ?)`;
      connection.query(query, [tgl, jenis, witel, real], (err) => {
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

// Fungsi untuk menghapus data yang tidak diperlukan
function deleteUnwantedRows(table) {
  const deleteWitelValues = ['TOTAL', 'REGIONAL', 'null'];
  deleteWitelValues.forEach((value) => {
    const sql = `DELETE FROM ${table} WHERE regional = ?`;
    connection.query(sql, [value], (err) => {
      if (err) {
        console.error(`Error deleting ${value} from ${table}:`, err);
      }
    });
  });
}

// Jalankan fungsi
deleteExistingData();
inputDataToDatabase('unspec_tif', 'unspec_datin', 'tif');

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);
