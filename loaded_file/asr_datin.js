const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['sugar_datin', 'hsi_sugar'];
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
function inputDataToDatabase(file, jenis, insertToTable) {
  const filePath = path.join(__dirname, 'asr_datin', `${file}.csv`);
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      const tgl = insertDate;
      const witel = data[Object.keys(data)[0]] || '';
      real_sugar = data[Object.keys(data)[5]] || '';

      const newWitel = witel.replace('REG-', 'REGIONAL 0');
      const fixwitel = newWitel.replace('TERRITORY ', 'TERRITORY 0');

      const query = `INSERT INTO ${insertToTable} (jenis, treg, tgl, \`real\`) VALUES (?, ?, ?,?)`;
      connection.query(query, [jenis, fixwitel, tgl, real_sugar], (err) => {
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
  const deleteWitelValues = ['GAUL', 'NASIONAL', 'Ach', 'SID', 'Comply', 'K1', 'K2', 'K3'];
  deleteWitelValues.forEach((value) => {
    const sql = `DELETE FROM ${table} WHERE treg = ?`;
    connection.query(sql, [value], (err) => {
      if (err) {
        console.error(`Error deleting ${value} from ${table}:`, err);
      }
    });
  });
}

// Jalankan fungsi
deleteExistingData();
inputDataToDatabase('sugar_datin_reg', 'reg', 'sugar_datin');
inputDataToDatabase('sugar_datin_tif', 'tif', 'sugar_datin');
inputDataToDatabase('sugar_hsi_reg', 'reg', 'hsi_sugar');
inputDataToDatabase('sugar_hsi_tif', 'tif', 'hsi_sugar');

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);
