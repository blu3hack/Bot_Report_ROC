const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const connection = require('./connection');

// Array tabel yang akan dihapus
const tableForDelete = ['wsa_service_nop', 'wsa_sugar_nop', 'wsa_ttr3_nop', 'wsa_ttr6_nop', 'wsa_ttr36_nop', 'wsa_ttrmanja_nop'];

async function deleteOldData() {
  const currentDate = new Date().toISOString().split('T')[0];

  for (const table of tableForDelete) {
    const sql = `DELETE FROM ${table} WHERE tgl=?`;
    connection.query(sql, [currentDate], (err) => {
      if (err) {
        console.error(`Gagal menghapus data dari ${table}:`, err.message);
      } else {
        console.log(`Data berhasil dihapus dari ${table}!`);
      }
    });
  }
}

async function inputDataToDatabase(file, jenis, insertToTable) {
  return new Promise((resolve) => {
    const filePath = path.join(__dirname, `wsa_gamas/${file}.csv`);

    if (!fs.existsSync(filePath)) {
      console.error(`File ${filePath} tidak ditemukan.`);
      resolve();
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        const witel = data[0] ? data[0].replace('TERITORY', 'TIF').replace('NOP ', '') : '';
        const selectionMonth = [];

        for (let i = 1; i <= 12; i++) {
          selectionMonth.push(data[i] ? data[i] : 100);
        }

        rows.push([currentDate, jenis, witel, ...selectionMonth]);
      })
      .on('end', () => {
        if (rows.length > 0) {
          const query = `INSERT INTO ${insertToTable} (tgl, lokasi, witel, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12)
                         VALUES ?`;

          connection.query(query, [rows], (err) => {
            if (err) {
              console.error(`Gagal memasukkan data ke ${insertToTable}:`, err.message);
            } else {
              console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
            }
          });

          // Penghapusan baris yang tidak penting
          const deleteValues = ['REGIONAL', 'TARGET', 'TOTAL', 'TERRITORY', 'TIF', ''];
          deleteValues.forEach((val) => {
            connection.query(`DELETE FROM ${insertToTable} WHERE witel=?`, [val], (err) => {
              if (err) {
                console.error(`Gagal menghapus data ${val} dari ${insertToTable}:`, err.message);
              }
            });
          });
        }
        resolve();
      });
  });
}

async function main() {
  await deleteOldData();

  const lokasi = ['area', 'balnus', 'jateng', 'jatim'];
  const katWsa = ['service', 'sugar', 'ttr3', 'ttr6', 'ttr36', 'ttrmanja'];
  const namaTable = ['wsa_service_nop', 'wsa_sugar_nop', 'wsa_ttr3_nop', 'wsa_ttr6_nop', 'wsa_ttr36_nop', 'wsa_ttrmanja_nop'];

  for (let i = 0; i < katWsa.length; i++) {
    for (let j = 0; j < lokasi.length; j++) {
      await inputDataToDatabase(`${katWsa[i]}_${lokasi[j]}`, lokasi[j], namaTable[i]);
    }
  }

  connection.end((err) => {
    if (err) {
      console.error('Error saat menutup koneksi database:', err.message);
    } else {
      console.log('Koneksi database ditutup.');
    }
  });
}

main();
