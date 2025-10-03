const fs = require('fs');
const mysql = require('mysql2');
const pool = require('./connection');

// Buat koneksi

function loadCSV(filename) {
  return new Promise((resolve, reject) => {
    const csvPath = `D:/SCRAPPERS/Scrapper/loaded_file/msa_upload/${filename}`;

    const query = `
      LOAD DATA LOCAL INFILE ?
      INTO TABLE msa_upload_backup
      FIELDS TERMINATED BY ',' 
      ENCLOSED BY '"'
      LINES TERMINATED BY '\n'
      IGNORE 1 ROWS
      (kpi, lokasi, Area, Realisasi, insert_at, bulan)
    `;

    pool.query(
      {
        sql: query,
        values: [csvPath], // pakai path lengkap
        infileStreamFactory: () => fs.createReadStream(csvPath),
      },
      (err, results) => {
        if (err) {
          console.error(`⚠️ Gagal mengimpor ${filename}:`, err);
          return reject(err);
        }
        console.log(`✅ Impor CSV ${filename} berhasil:`, results.affectedRows);
        resolve();
      }
    );
  });
}

async function run() {
  try {
    await loadCSV('district.csv');
    await loadCSV('tif.csv');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
