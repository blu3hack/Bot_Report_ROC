const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  return new Promise((resolve, reject) => {
    const tableForDelete = ['wsa_sugar_strive', 'wsa_service_strive', 'wsa_ttr3_strive', 'wsa_ttr6_strive', 'wsa_ttr36_strive', 'wsa_ttrmanja_strive'];
    const currentDate = insertDate;

    let count = 0;

    tableForDelete.forEach((table) => {
      const sql = `DELETE FROM ${table} WHERE tgl = ?`;
      connection.query(sql, [currentDate], (err) => {
        if (err) {
          console.error(`Error deleting data from ${table}:`, err);
          reject(err);
        } else {
          count++;
          if (count === tableForDelete.length) {
            resolve(); // Selesai menghapus
          }
        }
      });
    });
  });
}

// Fungsi untuk memasukkan data dari CSV ke database
function inputDataToDatabase(file, jenis, insertToTable) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'wsa_gamas', `${file}.csv`);
    const tgl = insertDate;

    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const witel = data[Object.keys(data)[0]] || '';
        const m01 = data[Object.keys(data)[1]] || '';
        const m02 = data[Object.keys(data)[2]] || '';
        const m03 = data[Object.keys(data)[3]] || '';
        const m04 = data[Object.keys(data)[4]] || '';
        const m05 = data[Object.keys(data)[5]] || '';
        const m06 = data[Object.keys(data)[6]] || '';
        const m07 = data[Object.keys(data)[7]] || '';
        const m08 = data[Object.keys(data)[8]] || '';
        const m09 = data[Object.keys(data)[9]] || '';
        const m10 = data[Object.keys(data)[10]] || '';
        const m11 = data[Object.keys(data)[11]] || '';
        const m12 = data[Object.keys(data)[12]] || '';

        const newWitel = witel.replace('TERITORY', 'TERRITORY');

        rows.push([tgl, jenis, newWitel, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12]);
      })
      .on('end', () => {
        const query = `INSERT INTO ${insertToTable} 
          (tgl, lokasi, witel, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12) 
          VALUES ?`;

        connection.query(query, [rows], (err) => {
          if (err) {
            console.error('Error inserting data:', err);
            reject(err);
          } else {
            console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
            deleteUnwantedRows(insertToTable).then(resolve).catch(reject);
          }
        });
      })
      .on('error', (err) => {
        console.error('Gagal membuka file CSV:', err);
        reject(err);
      });
  });
}

// Fungsi untuk menghapus data yang tidak diperlukan
function deleteUnwantedRows(table) {
  return new Promise((resolve, reject) => {
    const deleteWitelValues = ['TOTAL', 'TARGET'];
    let count = 0;

    deleteWitelValues.forEach((value) => {
      const sql = `DELETE FROM ${table} WHERE witel = ?`;
      connection.query(sql, [value], (err) => {
        if (err) {
          console.error(`Error deleting ${value} from ${table}:`, err);
          reject(err);
        } else {
          count++;
          if (count === deleteWitelValues.length) {
            resolve();
          }
        }
      });
    });
  });
}

// Fungsi utama untuk menjalankan semua proses secara berurutan
async function run() {
  try {
    await deleteExistingData();

    const files = [
      ['sugar_tif', 'tif'],
      ['sugar_district_tif1', 'tif'],
      ['sugar_district_tif2', 'tif'],
      ['sugar_district_tif3', 'tif'],
      ['sugar_district_tif4', 'tif'],
      ['sugar_nas', 'reg'],
      ['sugar_tr1', 'reg'],
      ['sugar_tr2', 'reg'],
      ['sugar_tr3', 'reg'],
      ['sugar_tr4', 'reg'],
      ['sugar_tr5', 'reg'],
      ['sugar_tr6', 'reg'],
      ['sugar_tr7', 'reg'],
    ];

    for (const [file, jenis] of files) {
      await inputDataToDatabase(file, jenis, 'wsa_sugar_strive');
    }

    console.log('Semua file selesai diproses.');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    connection.end();
  }
}

run();
