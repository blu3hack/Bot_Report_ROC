const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['unspec_warranty', 'unspec_warranty_wifi'];
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
  const filePath = path.join(__dirname, 'ff_non_hsi', `${file}.csv`);

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ',', headers: false }))
    .on('data', (data) => {
      const tgl = insertDate;
      const witel = data[Object.keys(data)[0]] || '';

      let real = '';
      // avg = data[Object.keys(data)[1]] || '';
      // jml = data[Object.keys(data)[2]] || '';
      // if (avg == 0 || jml == 0) {
      //   real = 100;
      // } else {
      //   real = data[Object.keys(data)[0]] || '';
      // }
      real = data[Object.keys(data)[3]] || '';

      let newWitel = '';

      if (jenis == 'tif') {
        newWitel = witel.replace('REG-', 'TERRITORY 0');
      } else {
        newWitel = witel.replace('REG-', 'REGIONAL 0');
      }

      const lokasi1 = newWitel.replace('JATIM BARAT', 'MALANG');
      const lokasi2 = lokasi1.replace('JATIM TIMUR', 'SIDOARJO');
      const lokasi3 = lokasi2.replace('SEMARANG JATENG UTARA', 'SEMARANG');
      const lokasi4 = lokasi3.replace('SOLO JATENG TIMUR', 'SOLO');
      const lokasi5 = lokasi4.replace('YOGYA JATENG SELATAN', 'YOGYAKARTA');

      const query = `INSERT INTO ${insertToTable} (tgl, jenis, regional, comply) VALUES (?, ?, ?, ?)`;
      connection.query(query, [tgl, jenis, lokasi5, real], (err) => {
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
inputDataToDatabase('unspec_warranty_tif', 'unspec_warranty', 'tif');
inputDataToDatabase('unspec_warranty_district', 'unspec_warranty', 'tif');
inputDataToDatabase('unspec_warranty_reg', 'unspec_warranty', 'reg');
inputDataToDatabase('unspec_warranty_reg4', 'unspec_warranty', 'reg');
inputDataToDatabase('unspec_warranty_reg5', 'unspec_warranty', 'reg');

inputDataToDatabase('unspec_warranty_wifi_tif', 'unspec_warranty_wifi', 'tif');
inputDataToDatabase('unspec_warranty_wifi_district', 'unspec_warranty_wifi', 'tif');
inputDataToDatabase('unspec_warranty_wifi_reg', 'unspec_warranty_wifi', 'reg');
inputDataToDatabase('unspec_warranty_wifi_reg4', 'unspec_warranty_wifi', 'reg');
inputDataToDatabase('unspec_warranty_wifi_reg5', 'unspec_warranty_wifi', 'reg');

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);
