const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Hapus data dengan tanggal hari ini
function deleteExistingData() {
  const tableForDelete = ['cnop_critical', 'cnop_latency'];
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
function inputDataToDatabase(kpi, file, insertToTable) {
  const filePath = path.join(__dirname, 'cnop', `${file}.csv`);
  const currentDate = insertDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      let lokasi = data[Object.keys(data)[1]] || '';
      let area = data[Object.keys(data)[2]] || '';
      let cnop_critical = data[Object.keys(data)[6]] || '';
      let cnop_latency = data[Object.keys(data)[7]] || '';

      const tgl = currentDate;

      const query = `INSERT INTO ${insertToTable} (kpi, lokasi, area, realisasi, insert_at) VALUES (?, ?, ?, ?, ?)`;

      if (insertToTable == 'cnop_critical') {
        connection.query(query, [kpi, area, lokasi, cnop_critical, tgl], (err) => {
          if (err) {
            console.error('Error inserting data:', err);
          }
        });
      } else {
        connection.query(query, [kpi, area, lokasi, cnop_latency, tgl], (err) => {
          if (err) {
            console.error('Error inserting data:', err);
          }
        });
      }
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

// Eksekusi seluruh proses
deleteExistingData();
inputDataToDatabase('ONM-WHM-Latency RAN to Core', 'PI Laten - TIF3 MSO 2025(MAIN_VAR_CNOP)', 'cnop_latency');
inputDataToDatabase('ASR-WHM-MTTRi Critical Compliance', 'PI Laten - TIF3 MSO 2025(MAIN_VAR_CNOP)', 'cnop_critical');

// Tutup koneksi DB setelah semua proses selesai
setTimeout(() => {
  connection.end();
}, 6000);
