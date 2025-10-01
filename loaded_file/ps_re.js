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
  const filePath = path.join(__dirname, 'ps_re', `${file}.csv`);
  const currentDate = insertDate;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      let witel = data[Object.keys(data)[0]] || '';

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

      if (area == 'reg') {
        if (witel.includes('TERRITORY ')) {
          witel = witel.replace('TERRITORY ', 'REGIONAL 0');
        }
      } else {
        if (witel.includes('TERRITORY ')) {
          witel = witel.replace('TERRITORY ', 'TERRITORY 0');
        }
      }

      const psre = data[Object.keys(data)[6]] || '';
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
  const deleteWitelValues = ['TOTAL', '', '(CANCEL+FALLOUT)', 'GROSS', 'NETT', 'Table 2', 'TERRITORY'];
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
inputDataToDatabase('ps_re_tif', 'tif', 'ps_re');
inputDataToDatabase('ps_re_reg', 'reg', 'ps_re');

// Tutup koneksi DB setelah semua proses selesai
setTimeout(() => {
  connection.end();
}, 6000);
