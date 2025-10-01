const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['ffg_non_hsi', 'ttr_ffg_non_hsi', 'ttd_non_hsi'];
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
    .pipe(csv())
    .on('data', (data) => {
      const tgl = insertDate;
      const witel = data[Object.keys(data)[0]] || '';

      let real = '';

      if (insertToTable == 'ttd_non_hsi') {
        real = data[Object.keys(data)[4]] || '';
        real = data[Object.keys(data)[4]] || '';
        real = data[Object.keys(data)[4]] || '';
      } else {
        avg = data[Object.keys(data)[1]] || '';
        jml = data[Object.keys(data)[2]] || '';
        if (avg == 0 || jml == 0) {
          real = 100;
        } else {
          real = data[Object.keys(data)[3]] || '';
        }
      }

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
inputDataToDatabase('ffg_tif', 'ffg_non_hsi', 'tif');
inputDataToDatabase('ffg_district', 'ffg_non_hsi', 'tif');
inputDataToDatabase('ffg_reg', 'ffg_non_hsi', 'reg');
inputDataToDatabase('ffg_reg4', 'ffg_non_hsi', 'reg');
inputDataToDatabase('ffg_reg5', 'ffg_non_hsi', 'reg');

inputDataToDatabase('ttr_ffg_tif', 'ttr_ffg_non_hsi', 'tif');
inputDataToDatabase('ttr_ffg_district', 'ttr_ffg_non_hsi', 'tif');
inputDataToDatabase('ttr_ffg_reg', 'ttr_ffg_non_hsi', 'reg');
inputDataToDatabase('ttr_ffg_reg4', 'ttr_ffg_non_hsi', 'reg');
inputDataToDatabase('ttr_ffg_reg5', 'ttr_ffg_non_hsi', 'reg');

inputDataToDatabase('ttdc_tif', 'ttd_non_hsi', 'tif');
inputDataToDatabase('ttdc_district', 'ttd_non_hsi', 'tif');
inputDataToDatabase('ttdc_reg', 'ttd_non_hsi', 'reg');
inputDataToDatabase('ttdc_reg4', 'ttd_non_hsi', 'reg');
inputDataToDatabase('ttdc_reg5', 'ttd_non_hsi', 'reg');

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);
