const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Hapus data dengan tanggal hari ini
function deleteExistingData() {
  const tableForDelete = ['cnop_premium'];
  const currentDate = insertDate;

  tableForDelete.forEach((table) => {
    const sql = `DELETE FROM ${table} WHERE insert_at = ?`;
    connection.query(sql, [currentDate], (err) => {
      if (err) {
        console.error(`Error deleting data from ${table}:`, err);
      }
    });
  });
}

// Baca CSV dan insert ke database
function inputDataToDatabase(file, insertToTable) {
  const filePath = path.join(__dirname, 'ff_non_hsi', `${file}.csv`);
  const currentDate = insertDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      let kpi = data[Object.keys(data)[0]] || '';
      let lokasi = data[Object.keys(data)[1]] || '';
      let area = data[Object.keys(data)[2]] || '';
      const realisasiRaw = data[Object.keys(data)[3]] || '';
      const realisasi = realisasiRaw !== '' ? parseFloat(realisasiRaw).toFixed(2) : '';

      const tgl = currentDate;

      const query = `INSERT INTO ${insertToTable} (kpi, lokasi, area, realisasi, insert_at) VALUES (?, ?, ?, ?, ?)`;
      connection.query(query, [kpi, lokasi, area, realisasi, tgl], (err) => {
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
// function insertAggregatedDataToPsReTest() {
//   const currentDate = insertDate;

//   const queries = [
//     {
//       witelGroup: ['REGIONAL 01'],
//       lokasi: 'TERRITORY 01',
//     },
//     {
//       witelGroup: ['REGIONAL 02', 'REGIONAL 03'],
//       lokasi: 'TERRITORY 02',
//     },
//     {
//       witelGroup: ['REGIONAL 04', 'REGIONAL 05'],
//       lokasi: 'TERRITORY 03',
//     },
//     {
//       witelGroup: ['REGIONAL 06', 'REGIONAL 07'],
//       lokasi: 'TERRITORY 04',
//     },
//     {
//       witelGroup: ['DENPASAR', 'SINGARAJA'],
//       lokasi: 'BALI',
//     },
//     {
//       witelGroup: ['JEMBER', 'PASURUAN', 'SIDOARJO'],
//       lokasi: 'SIDOARJO',
//     },
//     {
//       witelGroup: ['MALANG', 'MADIUN', 'KEDIRI'],
//       lokasi: 'MALANG',
//     },
//     {
//       witelGroup: ['NTB', 'NTT'],
//       lokasi: 'NUSA TENGGARA',
//     },
//     {
//       witelGroup: ['SURABAYA UTARA', 'SURABAYA SELATAN', 'MADURA'],
//       lokasi: 'SURAMADU',
//     },
//     {
//       witelGroup: ['SOLO', 'KUDUS'],
//       lokasi: 'SOLO',
//     },
//     {
//       witelGroup: ['SEMARANG', 'PEKALONGAN'],
//       lokasi: 'SEMARANG',
//     },
//     {
//       witelGroup: ['YOGYAKARTA', 'MAGELANG', 'PURWOKERTO'],
//       lokasi: 'YOGYAKARTA',
//     },
//   ];

//   queries.forEach((item) => {
//     const placeholders = item.witelGroup.map(() => '?').join(', ');
//     const sql = `
//       INSERT INTO ps_re (tgl, area, lokasi, psre)
//       SELECT ?, 'tif', ?, ROUND(AVG(psre), 2)
//       FROM ps_re
//       WHERE lokasi IN (${placeholders}) AND tgl = ?
//     `;
//     const params = [currentDate, item.lokasi, ...item.witelGroup, currentDate];

//     connection.query(sql, params, (err) => {
//       if (err) {
//         console.error(`Gagal insert agregat untuk ${item.lokasi}:`, err);
//       } else {
//         console.log(`Berhasil insert agregat untuk ${item.lokasi}`);
//       }
//     });
//   });
// }

// Eksekusi seluruh proses
deleteExistingData();
inputDataToDatabase('cnop_latency', 'cnop_latency');

// Beri waktu agar input CSV selesai sebelum agregasi
// setTimeout(() => {
//   insertAggregatedDataToPsReTest();
// }, 3000);

// Tutup koneksi DB setelah semua proses selesai
setTimeout(() => {
  connection.end();
}, 6000);
