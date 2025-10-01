const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['sugar_wifi', 'ttr_wifi'];
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
  const filePath = path.join(__dirname, 'asr_wifi', `${file}.csv`);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      const tgl = insertDate;
      const witel = data[Object.keys(data)[0]] || '';

      let comp;
      if (file.includes('ttr') && jenis === 'teritory') {
        comp = data[Object.keys(data)[4]] || '';
      } else {
        comp = data[Object.keys(data)[5]] || '';
      }

      const newWitel = witel.replace('REG-', 'REGIONAL 0');
      const lokasi = newWitel.replace('TERRITORY ', 'TERRITORY 0');
      const lokasi1 = lokasi.replace('JATIM BARAT', 'MALANG');
      const lokasi2 = lokasi1.replace('JATIM TIMUR', 'SIDOARJO');
      const lokasi3 = lokasi2.replace('SEMARANG JATENG UTARA', 'SEMARANG');
      const lokasi4 = lokasi3.replace('SOLO JATENG TIMUR', 'SOLO');
      const lokasi5 = lokasi4.replace('YOGJA JATENG SELATAN', 'YOGYAKARTA');

      const query = `INSERT INTO ${insertToTable} (tgl, jenis, regional, comply) VALUES (?, ?, ?, ?)`;
      connection.query(query, [tgl, jenis, lokasi5, comp], (err) => {
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
  const deleteWitelValues = ['Regional', 'SUGAR (%)', 'Gaul', 'Nasional', 'Comply', 'Territory'];
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
inputDataToDatabase('sugar_regional', 'reg', 'sugar_wifi');
inputDataToDatabase('sugar_teritory', 'tif', 'sugar_wifi');
inputDataToDatabase('ttr_regional', 'reg', 'ttr_wifi');
inputDataToDatabase('ttr_teritory', 'tif', 'ttr_wifi');

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);
