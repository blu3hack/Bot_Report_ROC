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
      const sql = `DELETE FROM ${table}`;
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
      ['sugar_tif', 'tif', 'wsa_sugar_strive'],
      ['sugar_district_tif1', 'tif', 'wsa_sugar_strive'],
      ['sugar_district_tif2', 'tif', 'wsa_sugar_strive'],
      ['sugar_district_tif3', 'tif', 'wsa_sugar_strive'],
      ['sugar_district_tif4', 'tif', 'wsa_sugar_strive'],
      ['sugar_nas', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr1', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr2', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr3', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr4', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr5', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr6', 'reg', 'wsa_sugar_strive'],
      ['sugar_tr7', 'reg', 'wsa_sugar_strive'],
      ['service_tif', 'tif', 'wsa_service_strive'],
      ['service_district_tif1', 'tif', 'wsa_service_strive'],
      ['service_district_tif2', 'tif', 'wsa_service_strive'],
      ['service_district_tif3', 'tif', 'wsa_service_strive'],
      ['service_district_tif4', 'tif', 'wsa_service_strive'],
      ['service_nas', 'reg', 'wsa_service_strive'],
      ['service_tr1', 'reg', 'wsa_service_strive'],
      ['service_tr2', 'reg', 'wsa_service_strive'],
      ['service_tr3', 'reg', 'wsa_service_strive'],
      ['service_tr4', 'reg', 'wsa_service_strive'],
      ['service_tr5', 'reg', 'wsa_service_strive'],
      ['service_tr6', 'reg', 'wsa_service_strive'],
      ['service_tr7', 'reg', 'wsa_service_strive'],
      ['ttr3_tif', 'tif', 'wsa_ttr3_strive'],
      ['ttr3_district_tif1', 'tif', 'wsa_ttr3_strive'],
      ['ttr3_district_tif2', 'tif', 'wsa_ttr3_strive'],
      ['ttr3_district_tif3', 'tif', 'wsa_ttr3_strive'],
      ['ttr3_district_tif4', 'tif', 'wsa_ttr3_strive'],
      ['ttr3_nas', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr1', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr2', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr3', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr4', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr5', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr6', 'reg', 'wsa_ttr3_strive'],
      ['ttr3_tr7', 'reg', 'wsa_ttr3_strive'],
      ['ttr6_tif', 'tif', 'wsa_ttr6_strive'],
      ['ttr6_district_tif1', 'tif', 'wsa_ttr6_strive'],
      ['ttr6_district_tif2', 'tif', 'wsa_ttr6_strive'],
      ['ttr6_district_tif3', 'tif', 'wsa_ttr6_strive'],
      ['ttr6_district_tif4', 'tif', 'wsa_ttr6_strive'],
      ['ttr6_nas', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr1', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr2', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr3', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr4', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr5', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr6', 'reg', 'wsa_ttr6_strive'],
      ['ttr6_tr7', 'reg', 'wsa_ttr6_strive'],
      ['ttr36_tif', 'tif', 'wsa_ttr36_strive'],
      ['ttr36_district_tif1', 'tif', 'wsa_ttr36_strive'],
      ['ttr36_district_tif2', 'tif', 'wsa_ttr36_strive'],
      ['ttr36_district_tif3', 'tif', 'wsa_ttr36_strive'],
      ['ttr36_district_tif4', 'tif', 'wsa_ttr36_strive'],
      ['ttr36_nas', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr1', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr2', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr3', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr4', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr5', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr6', 'reg', 'wsa_ttr36_strive'],
      ['ttr36_tr7', 'reg', 'wsa_ttr36_strive'],
      ['ttrmanja_tif', 'tif', 'wsa_ttrmanja_strive'],
      ['ttrmanja_district_tif1', 'tif', 'wsa_ttrmanja_strive'],
      ['ttrmanja_district_tif2', 'tif', 'wsa_ttrmanja_strive'],
      ['ttrmanja_district_tif3', 'tif', 'wsa_ttrmanja_strive'],
      ['ttrmanja_district_tif4', 'tif', 'wsa_ttrmanja_strive'],
      ['ttrmanja_nas', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr1', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr2', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr3', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr4', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr5', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr6', 'reg', 'wsa_ttrmanja_strive'],
      ['ttrmanja_tr7', 'reg', 'wsa_ttrmanja_strive'],
    ];

    for (const [file, jenis, insertToTable] of files) {
      await inputDataToDatabase(file, jenis, insertToTable);
    }

    console.log('Semua file selesai diproses.');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    connection.end();
  }
}

run();
