const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Buat koneksi ke database

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  // const tableForDelete = ['wsa_sugar_strive'];
  const tableForDelete = ['wsa_sugar', 'wsa_service', 'wsa_ttr3', 'wsa_ttr6', 'wsa_ttr36', 'wsa_ttrmanja'];
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
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'wsa_gamas', `${file}.csv`);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const tgl = insertDate;
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

        const query = `INSERT INTO ${insertToTable} 
          (tgl, lokasi, witel, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12) 
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        connection.query(query, [tgl, jenis, newWitel, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12], (err) => {
          if (err) {
            console.error('Error inserting data:', err);
          }
        });
      })
      .on('end', () => {
        console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
        deleteUnwantedRows(insertToTable);
        resolve(); // selesai → lanjut ke berikutnya
      })
      .on('error', (err) => {
        console.error('Gagal membuka file CSV:', err);
        reject(err);
      });
  });
}

// Fungsi untuk menghapus data yang tidak diperlukan
function deleteUnwantedRows(table) {
  const deleteWitelValues = ['TOTAL', 'TARGET'];
  deleteWitelValues.forEach((value) => {
    const sql = `DELETE FROM ${table} WHERE witel = ?`;
    connection.query(sql, [value], (err) => {
      if (err) {
        console.error(`Error deleting ${value} from ${table}:`, err);
      }
    });
  });
}

// Jalankan fungsi

// Tutup koneksi setelah semua query selesai
setTimeout(() => {
  connection.end();
}, 5000);

async function main() {
  deleteExistingData();

  deleteExistingData();
  await inputDataToDatabase('service_tif', 'tif', 'wsa_service');
  await inputDataToDatabase('service_district', 'tif', 'wsa_service');
  await inputDataToDatabase('service_nas', 'reg', 'wsa_service');
  await inputDataToDatabase('service_tr4', 'reg', 'wsa_service');
  await inputDataToDatabase('service_tr5', 'reg', 'wsa_service');

  await inputDataToDatabase('service_area', 'area', 'wsa_service_nop');
  await inputDataToDatabase('service_balnus', 'balnus', 'wsa_service_nop');
  await inputDataToDatabase('service_jateng', 'jateng', 'wsa_service_nop');
  await inputDataToDatabase('service_jatim', 'jatim', 'wsa_service_nop');

  await inputDataToDatabase('sugar_tif', 'tif', 'wsa_sugar');
  await inputDataToDatabase('sugar_district', 'tif', 'wsa_sugar');
  await inputDataToDatabase('sugar_nas', 'reg', 'wsa_sugar');
  await inputDataToDatabase('sugar_tr4', 'reg', 'wsa_sugar');
  await inputDataToDatabase('sugar_tr5', 'reg', 'wsa_sugar');

  await inputDataToDatabase('sugar_area', 'area', 'wsa_sugar_nop');
  await inputDataToDatabase('sugar_balnus', 'balnus', 'wsa_sugar_nop');
  await inputDataToDatabase('sugar_jateng', 'jateng', 'wsa_sugar_nop');
  await inputDataToDatabase('sugar_jatim', 'jatim', 'wsa_sugar_nop');

  await inputDataToDatabase('ttr3_tif', 'tif', 'wsa_ttr3');
  await inputDataToDatabase('ttr3_district', 'tif', 'wsa_ttr3');
  await inputDataToDatabase('ttr3_nas', 'reg', 'wsa_ttr3');
  await inputDataToDatabase('ttr3_tr4', 'reg', 'wsa_ttr3');
  await inputDataToDatabase('ttr3_tr5', 'reg', 'wsa_ttr3');

  await inputDataToDatabase('ttr3_area', 'area', 'wsa_ttr3_nop');
  await inputDataToDatabase('ttr3_balnus', 'balnus', 'wsa_ttr3_nop');
  await inputDataToDatabase('ttr3_jateng', 'jateng', 'wsa_ttr3_nop');
  await inputDataToDatabase('ttr3_jatim', 'jatim', 'wsa_ttr3_nop');

  await inputDataToDatabase('ttr6_tif', 'tif', 'wsa_ttr6');
  await inputDataToDatabase('ttr6_district', 'tif', 'wsa_ttr6');
  await inputDataToDatabase('ttr6_nas', 'reg', 'wsa_ttr6');
  await inputDataToDatabase('ttr6_tr4', 'reg', 'wsa_ttr6');
  await inputDataToDatabase('ttr6_tr5', 'reg', 'wsa_ttr6');

  await inputDataToDatabase('ttr6_area', 'area', 'wsa_ttr6_nop');
  await inputDataToDatabase('ttr6_balnus', 'balnus', 'wsa_ttr6_nop');
  await inputDataToDatabase('ttr6_jateng', 'jateng', 'wsa_ttr6_nop');
  await inputDataToDatabase('ttr6_jatim', 'jatim', 'wsa_ttr6_nop');

  await inputDataToDatabase('ttr36_tif', 'tif', 'wsa_ttr36');
  await inputDataToDatabase('ttr36_district', 'tif', 'wsa_ttr36');
  await inputDataToDatabase('ttr36_nas', 'reg', 'wsa_ttr36');
  await inputDataToDatabase('ttr36_tr4', 'reg', 'wsa_ttr36');
  await inputDataToDatabase('ttr36_tr5', 'reg', 'wsa_ttr36');

  await inputDataToDatabase('ttr36_area', 'area', 'wsa_ttr36_nop');
  await inputDataToDatabase('ttr36_balnus', 'balnus', 'wsa_ttr36_nop');
  await inputDataToDatabase('ttr36_jateng', 'jateng', 'wsa_ttr36_nop');
  await inputDataToDatabase('ttr36_jatim', 'jatim', 'wsa_ttr36_nop');

  await inputDataToDatabase('ttrmanja_tif', 'tif', 'wsa_ttrmanja');
  await inputDataToDatabase('ttrmanja_district', 'tif', 'wsa_ttrmanja');
  await inputDataToDatabase('ttrmanja_nas', 'reg', 'wsa_ttrmanja');
  await inputDataToDatabase('ttrmanja_tr4', 'reg', 'wsa_ttrmanja');
  await inputDataToDatabase('ttrmanja_tr5', 'reg', 'wsa_ttrmanja');

  await inputDataToDatabase('ttrmanja_area', 'area', 'wsa_ttrmanja_nop');
  await inputDataToDatabase('ttrmanja_balnus', 'balnus', 'wsa_ttrmanja_nop');
  await inputDataToDatabase('ttrmanja_jateng', 'jateng', 'wsa_ttrmanja_nop');
  await inputDataToDatabase('ttrmanja_jatim', 'jatim', 'wsa_ttrmanja_nop');

  connection.end(); // tutup setelah semua selesai
}

main().catch((err) => {
  console.error('Terjadi error:', err);
  connection.end();
});
