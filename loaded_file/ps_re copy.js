const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Hapus data dengan tanggal hari ini
function deleteExistingData() {
  const tableForDelete = ['ps_re'];
  const currentDate = insertDate;

  tableForDelete.forEach((table) => {
    const sql = `DELETE FROM ${table} WHERE tgl = ?`;
    connection.query(sql, [currentDate], (err) => {
      if (err) {
        console.error(`Error deleting data from ${table}:`, err);
      }
    });
  });
}

// Baca CSV dan insert ke database
function inputDataToDatabase(file, area, insertToTable) {
  const filePath = path.join(__dirname, 'wsa', `${file}.csv`);
  const currentDate = insertDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      let witel = data[Object.keys(data)[1]] || '';
      if (witel.includes('DIVRE ')) {
        witel = witel.replace('DIVRE ', 'REGIONAL 0');
      }

      const psre = data[Object.keys(data)[5]] || '';
      const lokasi = area;
      const tgl = currentDate;

      const query = `INSERT INTO ${insertToTable} (lokasi, area, psre, tgl) VALUES (?, ?, ?, ?)`;
      connection.query(query, [witel, lokasi, psre, tgl], (err) => {
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

function inputDataRegToDatabase(file, area, insertToTable) {
  const filePath = path.join(__dirname, 'wsa', `${file}.csv`);
  const currentDate = insertDate;

  // Header manual sesuai urutan kolom:
  // Kolom 0: Witel, Kolom 6: psre
  const headers = ['witel', 'col1', 'col2', 'col3', 'col4', 'col5', 'psre'];

  fs.createReadStream(filePath)
    .pipe(csv({ headers: headers, skipLines: 0 }))
    .on('data', (data) => {
      let witel = data.witel || '';
      const witelMappings = [
        { from: /^MATARAM\s*/i, to: 'NTB ' },
        { from: /^KUPANG\s*/i, to: 'NTT ' },
        { from: /^SINGARJA/i, to: 'SINGARAJA' },
        { from: /^SBY UTARA/i, to: 'SURABAYA UTARA' },
        { from: /^SBY SELATAN/i, to: 'SURABAYA SELATAN' },
      ];

      // Terapkan semua mapping
      for (const map of witelMappings) {
        if (map.from.test(witel)) {
          witel = witel.replace(map.from, map.to);
          break; // stop setelah ketemu satu yang cocok
        }
      }

      const psre = data.psre || '';
      const lokasi = area;
      const tgl = currentDate;

      const query = `INSERT INTO ${insertToTable} (lokasi, area, psre, tgl) VALUES (?, ?, ?, ?)`;
      connection.query(query, [witel, lokasi, psre, tgl], (err) => {
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

// Hapus baris TOTAL atau kosong
function deleteUnwantedRows(table) {
  const deleteWitelValues = ['TOTAL', ''];
  deleteWitelValues.forEach((value) => {
    const sql = `DELETE FROM ${table} WHERE lokasi = ?`;
    connection.query(sql, [value], (err) => {
      if (err) {
        console.error(`Error deleting ${value} from ${table}:`, err);
      }
    });
  });
}

// Agregat dan insert data 'TIF 01-04'
function insertAggregatedDataToPsReTest() {
  const currentDate = insertDate;

  const queries = [
    {
      witelGroup: ['REGIONAL 01'],
      lokasi: 'TERRITORY 01',
    },
    {
      witelGroup: ['REGIONAL 02', 'REGIONAL 03'],
      lokasi: 'TERRITORY 02',
    },
    {
      witelGroup: ['REGIONAL 04', 'REGIONAL 05'],
      lokasi: 'TERRITORY 03',
    },
    {
      witelGroup: ['REGIONAL 06', 'REGIONAL 07'],
      lokasi: 'TERRITORY 04',
    },
  ];

  queries.forEach((item) => {
    const placeholders = item.witelGroup.map(() => '?').join(', ');
    const sql = `
      INSERT INTO ps_re (tgl, area, lokasi, psre)
      SELECT ?, 'tif', ?, ROUND(AVG(psre), 2)
      FROM ps_re
      WHERE lokasi IN (${placeholders}) AND tgl = ?
    `;
    const params = [currentDate, item.lokasi, ...item.witelGroup, currentDate];

    connection.query(sql, params, (err) => {
      if (err) {
        console.error(`Gagal insert agregat untuk ${item.lokasi}:`, err);
      } else {
        console.log(`Berhasil insert agregat untuk ${item.lokasi}`);
      }
    });
  });
}

// Eksekusi seluruh proses
deleteExistingData();
inputDataToDatabase('psre_reg', 'reg', 'ps_re');
inputDataRegToDatabase('psre_tif', 'tif', 'ps_re');
inputDataRegToDatabase('psre_witel', 'reg', 'ps_re');

// Beri waktu agar input CSV selesai sebelum agregasi
setTimeout(() => {
  insertAggregatedDataToPsReTest();
}, 3000);

// Tutup koneksi DB setelah semua proses selesai
setTimeout(() => {
  connection.end();
}, 6000);
