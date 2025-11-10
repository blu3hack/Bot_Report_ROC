const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// 🔹 Fungsi hapus data berdasarkan tanggal saat ini
function deleteExistingData() {
  const tableForDelete = ['ttr_non_numbering'];
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
        const bulan = new Date(tgl).getMonth() + 1; // +1 karena getMonth() hasilnya 0–11
        const witel = data[Object.keys(data)[0]] || '';
        let real = '';

        real = data[Object.keys(data)[bulan]] || '';

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
      ['q_datin_tif', 'q_datin', 'tif'],
      ['q_datin_district', 'q_datin', 'tif'],
      ['q_datin_reg', 'q_datin', 'reg'],
      ['q_datin_reg4', 'q_datin', 'reg'],
      ['q_datin_reg5', 'q_datin', 'reg'],

      ['q_hsi_tif', 'q_hsi', 'tif'],
      ['q_hsi_district', 'q_hsi', 'tif'],
      ['q_hsi_reg', 'q_hsi', 'reg'],
      ['q_hsi_reg4', 'q_hsi', 'reg'],
      ['q_hsi_reg5', 'q_hsi', 'reg'],

      ['ttr_datin_tif', 'ttr_non_numbering', 'tif'],
      ['ttr_datin_district', 'ttr_non_numbering', 'tif'],
      ['ttr_datin_reg', 'ttr_non_numbering', 'reg'],
      ['ttr_datin_reg4', 'ttr_non_numbering', 'reg'],
      ['ttr_datin_reg5', 'ttr_non_numbering', 'reg'],
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
