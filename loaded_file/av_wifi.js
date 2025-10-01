const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Fungsi untuk menghapus data pada tanggal saat ini
function deleteExistingData() {
  return new Promise((resolve, reject) => {
    const tableForDelete = ['av_wifi_all', 'av_wifi_ms', 'av_wifi_basic'];
    const currentDate = insertDate;

    let queries = tableForDelete.map((table) => {
      return new Promise((resolve, reject) => {
        const sql = `DELETE FROM ${table} WHERE tgl = ?`;
        connection.query(sql, [currentDate], (err) => {
          if (err) {
            console.error(`Error deleting data from ${table}:`, err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(queries).then(resolve).catch(reject);
  });
}

// Fungsi untuk memasukkan data dari CSV ke database
function inputDataToDatabase(file, insertToTable, jenis) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'wifi_revi', `${file}.csv`);

    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on('data', (data) => {
        const tgl = insertDate;
        const keys = Object.keys(data);
        const real = data[keys[keys.length - 1]] || '';
        const witel = data[keys[0]] || '';

        let newWitel = witel.replace('TREG ', 'REGIONAL 0');

        rows.push([tgl, jenis, newWitel, real]);
      })
      .on('end', () => {
        if (rows.length > 0) {
          const query = `INSERT INTO ${insertToTable} (tgl, jenis, regional, comply) VALUES ?`;
          connection.query(query, [rows], (err) => {
            if (err) {
              console.error('Error inserting data:', err);
              reject(err);
            } else {
              console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
              deleteUnwantedRows(insertToTable).then(resolve).catch(reject);
            }
          });
        } else {
          resolve();
        }
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
    const deleteWitelValues = ['TOTAL', 'REGIONAL 0X'];
    let queries = deleteWitelValues.map((value) => {
      return new Promise((resolve, reject) => {
        const sql = `DELETE FROM ${table} WHERE regional = ?`;
        connection.query(sql, [value], (err) => {
          if (err) {
            console.error(`Error deleting ${value} from ${table}:`, err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(queries).then(resolve).catch(reject);
  });
}

// Fungsi untuk insert TIF Data
function insertTIFData() {
  return new Promise((resolve, reject) => {
    const currentDate = insertDate;

    function insertQueryData(table) {
      const insertQuery = `
      INSERT INTO ${table} (tgl, jenis, regional, comply)
      SELECT ?, 'tif', 'TERRITORY 01', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('REGIONAL 01') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'TERRITORY 02', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('REGIONAL 02', 'REGIONAL 03') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'TERRITORY 03', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('REGIONAL 04', 'REGIONAL 05') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'TERRITORY 04', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('REGIONAL 06', 'REGIONAL 07') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'BALI', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('DENPASAR', 'SINGARAJA') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'MALANG', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('MALANG', 'KEDIRI', 'MADIUN') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'NUSA TENGGARA', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('NTB', 'NTT') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'SEMARANG', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('SEMARANG', 'PEKALONGAN') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'SIDOARJO', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('JEMBER', 'PASURUAN', 'SIDOARJO') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'SOLO', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('SOLO', 'KUDUS') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'SURAMADU', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('SURABAYA SELATAN', 'SURABAYA UTARA', 'MADURA') AND tgl = ?)
      UNION ALL
      SELECT ?, 'tif', 'YOGYAKARTA', 
          (SELECT AVG(comply) FROM ${table} WHERE regional IN ('YOGYAKARTA', 'MAGELANG', 'PURWOKERTO') AND tgl = ?)
      `;

      // Pastikan jumlah parameter = jumlah `?` dalam query
      const params = Array(13)
        .fill(currentDate)
        .flatMap((date) => [date, date]);

      connection.query(insertQuery, params, (err, results) => {
        if (err) {
          console.error('Error inserting data:', err.sqlMessage || err);
          reject(err);
        } else {
          console.log(`Data Berhasil di Input ke Table ${table}`);
          resolve(results);
        }
      });
    }

    insertQueryData('av_wifi_all');
    insertQueryData('av_wifi_ms');
    insertQueryData('av_wifi_basic');
  });
}

// Fungsi utama untuk menjalankan semua proses secara berurutan
async function main() {
  try {
    await deleteExistingData();

    // Jalankan semua proses input CSV secara berurutan
    await inputDataToDatabase('av_all_reg', 'av_wifi_all', 'reg');
    await inputDataToDatabase('av_all_tr4', 'av_wifi_all', 'reg');
    await inputDataToDatabase('av_all_tr5', 'av_wifi_all', 'reg');

    await inputDataToDatabase('av_ms_reg', 'av_wifi_ms', 'reg');
    await inputDataToDatabase('av_ms_tr4', 'av_wifi_ms', 'reg');
    await inputDataToDatabase('av_ms_tr5', 'av_wifi_ms', 'reg');

    await inputDataToDatabase('av_basic_reg', 'av_wifi_basic', 'reg');
    await inputDataToDatabase('av_basic_tr4', 'av_wifi_basic', 'reg');
    await inputDataToDatabase('av_basic_tr5', 'av_wifi_basic', 'reg');

    // Jalankan insertTIFData() setelah semua data dari CSV selesai diinput
    await insertTIFData();
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    // Tutup koneksi database setelah semua proses selesai
    connection.end();
  }
}

// Jalankan fungsi utama
main();
