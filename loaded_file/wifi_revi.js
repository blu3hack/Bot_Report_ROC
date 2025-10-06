const fs = require('fs');
const path = require('path');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

function wifi_revi_reg(fileName, jenis) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'wifi_revi', `${fileName}.csv`).replace(/\\/g, '/');
    const query = `
    LOAD DATA LOCAL INFILE ?
    INTO TABLE wifi_revi_reg
    FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    (A,lokasi,C,D,E,F,G,H,I,J,K,realisasi,M,N,O,P,Q,R,S,T,U)
    SET jenis = ?`;

    connection.query(
      {
        sql: query,
        values: [filePath, jenis],
        infileStreamFactory: (path) => fs.createReadStream(path),
      },
      (err) => {
        if (err) return reject(err);
        console.log(`${fileName}.csv berhasil diinput ke database`);
        resolve();
      }
    );
  });
}

function deleteDataByCondition() {
  return new Promise((resolve, reject) => {
    const searchStrings = [
      'TREG 1',
      'TREG 2',
      'TREG 3',
      'TREG 4',
      'TREG 5',
      'TREG 6',
      'TREG 7',
      'KUDUS',
      'MAGELANG',
      'PEKALONGAN',
      'PURWOKERTO',
      'SEMARANG',
      'SOLO',
      'YOGYAKARTA',
      'DENPASAR',
      'JEMBER',
      'KEDIRI',
      'MADIUN',
      'MADURA',
      'MALANG',
      'NTB',
      'NTT',
      'PASURUAN',
      'SIDOARJO',
      'SINGARAJA',
      'SURABAYA SELATAN',
      'SURABAYA UTARA',
      'BALI',
      'JATIM BARAT',
      'JATIM TIMUR',
      'NUSA TENGGARA',
      'SEMARANG JATENG UTARA',
      'SOLO JATENG TIMUR',
      'SURAMADU',
      'YOGYA JATENG SELATAN',
    ];

    const whereClause = searchStrings.map(() => 'lokasi NOT LIKE ?').join(' AND ');
    const sql = `DELETE FROM wifi_revi_reg WHERE ${whereClause}`;

    connection.query(sql, searchStrings, (err, results) => {
      if (err) return reject(err);
      console.log(`Deleted ${results.affectedRows} rows`);
      resolve();
    });
  });
}

function insert_data() {
  return new Promise((resolve, reject) => {
    const currentDate = insertDate;
    const deleteQuery = 'DELETE FROM wifi_revi WHERE tgl = ?';

    connection.query(deleteQuery, [currentDate], (err, results) => {
      if (err) return reject(err);
      console.log(`Berhasil menghapus ${results.affectedRows} baris dari wifi_revi.`);

      const selectQuery = 'SELECT lokasi, K, realisasi, jenis FROM wifi_revi_reg';
      connection.query(selectQuery, (err, results) => {
        if (err) return reject(err);

        if (results.length === 0) {
          console.log('Tidak ada data untuk dipindahkan.');
          return resolve();
        }

        const insertQuery = 'INSERT INTO wifi_revi (tgl, jenis, regional, comply) VALUES ?';
        const lokasiMapping = {
          'JATIM BARAT': 'MALANG',
          'JATIM TIMUR': 'SIDOARJO',
          'SEMARANG JATENG UTARA': 'SEMARANG',
          'SOLO JATENG TIMUR': 'SOLO',
          'YOGYA JATENG SELATAN': 'YOGYAKARTA',
        };

        const values = results.map((row) => {
          let lokasi = row.lokasi.replace('TREG ', row.jenis === 'tif' ? 'TERRITORY 0' : 'REGIONAL 0');
          lokasi = lokasiMapping[lokasi] || lokasi;

          if (row.K == 0 && row.realisasi == 0) {
            row.realisasi = '-';
          }
          return [currentDate, row.jenis, lokasi, row.realisasi];
        });

        connection.query(insertQuery, [values], (err, insertResults) => {
          if (err) return reject(err);
          console.log(`Berhasil memasukkan ${insertResults.affectedRows} baris ke wifi_revi.`);
          resolve();
        });
      });
    });
  });
}

function deleteAllData() {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM wifi_revi_reg', (err, result) => {
      if (err) return reject(err);
      console.log(`Berhasil menghapus ${result.affectedRows} dari wifi_revi_reg.`);
      resolve();
    });
  });
}
function deleteDuplicates() {
  return new Promise((resolve, reject) => {
    const currentDate = insertDate;
    const sql = `
      DELETE t1
      FROM wifi_revi t1
      JOIN wifi_revi t2
        ON t1.regional = t2.regional
      WHERE 
        t1.comply = '-'
        AND t2.comply <> '-'
         AND t1.tgl = ?
    `;

    connection.query(sql, [currentDate], (err, result) => {
      if (err) return reject(err);
      console.log(`✅ Berhasil menghapus ${result.affectedRows} baris dari wifi_revi untuk tanggal ${currentDate}.`);
      resolve();
    });
  });
}

// Menjalankan semua fungsi secara berurutan
async function run() {
  try {
    await wifi_revi_reg('wifi_revi_reg', 'reg');
    await wifi_revi_reg('wifi_revi_tif', 'tif');
    await deleteDataByCondition();
    await insert_data();
    await deleteAllData();
    // await deleteDuplicates();
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    connection.end();
  }
}
run();
