const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// 🔹 Fungsi hapus data berdasarkan tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['sqm_datin', 'sqm_hsi'];
  const currentDate = insertDate;

  const deletePromises = tableForDelete.map((table) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM ${table} WHERE tgl = ?`;
      connection.query(sql, [currentDate], (err) => {
        if (err) {
          console.error(`❌ Error deleting data from ${table}:`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  return Promise.all(deletePromises);
}

// 🔹 Fungsi hapus data tidak diperlukan
function deleteUnwantedRows(table) {
  const deleteWitelValues = ['TOTAL', 'REGIONAL', 'TERITORY', 'SUMBAR', 'AREA', ''];
  const deletePromises = deleteWitelValues.map((value) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM ${table} WHERE regional = ?`;
      connection.query(sql, [value], (err) => {
        if (err) {
          console.error(`❌ Error deleting "${value}" from ${table}:`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  return Promise.all(deletePromises);
}

// 🔹 Fungsi untuk memasukkan data CSV ke database
function inputDataToDatabase(file, insertToTable, jenis) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'unspec_datin', `${file}.csv`);

    const insertPromises = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false }))
      .on('data', (data) => {
        const tgl = insertDate; // misalnya '2025-11-07'
        // const bulan = new Date(tgl).getMonth() + 1; // +1 karena getMonth() hasilnya 0–11
        const witel = data[Object.keys(data)[0]] || '';
        let real = '';

        real = data[Object.keys(data)[16]] || '';

        let newWitel = '';
        if (jenis === 'tif') {
          newWitel = witel.replace('TERRITORY ', 'TERRITORY 0');
        } else {
          newWitel = witel.replace('REGIONAL ', 'REGIONAL 0');
        }

        const lokasi = newWitel.replace('Telkom ', '');

        const query = `INSERT INTO ${insertToTable} (tgl, jenis, regional, comply) VALUES (?, ?, ?, ?)`;

        // Simpan semua query ke dalam array Promise
        insertPromises.push(
          new Promise((resolveInsert, rejectInsert) => {
            connection.query(query, [tgl, jenis, lokasi, real], (err) => {
              if (err) {
                console.error(`❌ Error inserting data ke ${insertToTable}:`, err);
                rejectInsert(err);
              } else {
                resolveInsert();
              }
            });
          })
        );
      })
      .on('end', async () => {
        try {
          await Promise.all(insertPromises);
          await deleteUnwantedRows(insertToTable);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error(`❌ Gagal membuka file CSV ${file}:`, err);
        reject(err);
      });
  });
}

// 🔹 Jalankan proses utama
async function run() {
  try {
    console.log('🔄 Menghapus data lama...');
    await deleteExistingData();

    const files = [
      ['sqm_datin_tif', 'sqm_datin', 'tif'],
      ['sqm_datin_district', 'sqm_datin', 'tif'],
      ['sqm_datin_reg', 'sqm_datin', 'reg'],
      ['sqm_datin_reg4', 'sqm_datin', 'reg'],
      ['sqm_datin_reg5', 'sqm_datin', 'reg'],

      ['sqm_hsi_tif', 'sqm_hsi', 'tif'],
      ['sqm_hsi_district', 'sqm_hsi', 'tif'],
      ['sqm_hsi_reg', 'sqm_hsi', 'reg'],
      ['sqm_hsi_reg4', 'sqm_hsi', 'reg'],
      ['sqm_hsi_reg5', 'sqm_hsi', 'reg'],
    ];

    for (const [file, insertToTable, jenis] of files) {
      console.log(`📥 Memproses file: ${file}.csv`);
      await inputDataToDatabase(file, insertToTable, jenis);
    }
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat memproses data:', err);
  } finally {
    connection.end();
  }
}

// Jalankan
run();
