const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connection = require('./connection');
const { insertDate } = require('../currentDate');

// Promisify query
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Fungsi hapus data berdasarkan tanggal hari ini
async function deleteExistingData() {
  const tableForDelete = ['ttr_datin', 'ttr_reseller', 'ttr_indibiz', 'ttr_siptrunk', 'ttr_dwdm'];
  const currentDate = insertDate;

  for (const table of tableForDelete) {
    const sql = `DELETE FROM ${table} WHERE tgl = ?`;
    await queryAsync(sql, [currentDate]).catch((err) => {
      console.error(`Error deleting data from ${table}:`, err);
    });
  }
}

// Fungsi hapus data yang tidak perlu
async function deleteUnwantedRows(table) {
  const deleteWitelValues = ['GAUL', 'NASIONAL', 'Ach', 'SID', 'Comply', 'K1', 'K2', 'K3', '(Jam)'];
  for (const value of deleteWitelValues) {
    const sql = `DELETE FROM ${table} WHERE treg = ?`;
    await queryAsync(sql, [value]).catch((err) => {
      console.error(`Error deleting ${value} from ${table}:`, err);
    });
  }
}

// Fungsi input data dari file CSV ke DB
async function inputDataToDatabase(file, jenis, insertToTable) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'asr_datin', `${file}.csv`);
    const tgl = insertDate;

    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const witel = data[Object.keys(data)[0]] || '';
        let real_sugar = insertToTable === 'sugar_datin' ? data[Object.keys(data)[5]] || '' : data[Object.keys(data)[13]] || '';
        const k1 = (data[Object.keys(data)[6]] || '').replace(/%/g, '');
        const k2 = (data[Object.keys(data)[13]] || '').replace(/%/g, '');
        const k3 = (data[Object.keys(data)[20]] || '').replace(/%/g, '');
        const resel_indi_6h_4h = (data[Object.keys(data)[4]] || '').replace(/%/g, '');
        const resel_indi_36h_24h = (data[Object.keys(data)[9]] || '').replace(/%/g, '');
        const target_siptrunk_dwdm = (data[Object.keys(data)[1]] || '').replace(/%/g, '');
        const real_siptrunk_dwdm = (data[Object.keys(data)[3]] || '').replace(/%/g, '');
        const ach_siptrunk_dwdm = (data[Object.keys(data)[4]] || '').replace(/%/g, '');

        const newWitel = witel.replace('REG-', 'REGIONAL 0');
        const fixwitel = newWitel.replace('TERRITORY ', 'TERRITORY 0');

        rows.push({
          jenis,
          fixwitel,
          tgl,
          k1,
          k2,
          k3,
          resel_indi_6h_4h,
          resel_indi_36h_24h,
          target_siptrunk_dwdm,
          real_siptrunk_dwdm,
          ach_siptrunk_dwdm,
        });
      })
      .on('end', async () => {
        try {
          for (const row of rows) {
            if (insertToTable === 'ttr_datin') {
              const sql = `INSERT INTO ${insertToTable} (jenis, treg, tgl, k1, k2, k3) VALUES (?, ?, ?, ?, ?, ?)`;
              await queryAsync(sql, [row.jenis, row.fixwitel, row.tgl, row.k1, row.k2, row.k3]);
            } else if (insertToTable === 'ttr_reseller' || insertToTable === 'ttr_indibiz') {
              const sql = `INSERT INTO ${insertToTable} (jenis, treg, tgl, real_1, real_2) VALUES (?, ?, ?, ?, ?)`;
              await queryAsync(sql, [row.jenis, row.fixwitel, row.tgl, row.resel_indi_6h_4h, row.resel_indi_36h_24h]);
            } else if (insertToTable === 'ttr_siptrunk' || insertToTable === 'ttr_dwdm') {
              const sql = `INSERT INTO ${insertToTable} (jenis, treg, tgl, target, \`real\`, ach) VALUES (?, ?, ?, ?, ?, ?)`;
              await queryAsync(sql, [row.jenis, row.fixwitel, row.tgl, row.target_siptrunk_dwdm, row.real_siptrunk_dwdm, row.ach_siptrunk_dwdm]);
            }
          }
          await deleteUnwantedRows(insertToTable);
          console.log(`${file} berhasil diinput ke tabel ${insertToTable}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Fungsi untuk menghapus duplikat data di ttr_datin
async function delete_ttr_datin_duplicate() {
  const query = `
    DELETE FROM ttr_datin
    WHERE jenis = 'reg'
    AND k2 IS NULL OR k2 = 'nan'
    AND treg IN (
      SELECT treg
      FROM ttr_datin
      WHERE jenis = 'reg'
      GROUP BY treg
      HAVING COUNT(*) > 1
    );
  `;
  await queryAsync(query).catch((err) => {
    console.error('Gagal menghapus data duplicate:', err);
  });
}

// MAIN
async function main() {
  try {
    await deleteExistingData();

    const inputList = [
      ['ttr_datin_reg', 'reg', 'ttr_datin'],
      ['ttr_datin_tif', 'tif', 'ttr_datin'],
      ['indibiz_reg', 'reg', 'ttr_indibiz'],
      ['indibiz_tif', 'tif', 'ttr_indibiz'],
      ['reseller_reg', 'reg', 'ttr_reseller'],
      ['reseller_tif', 'tif', 'ttr_reseller'],
      ['siptrunk_reg', 'reg', 'ttr_siptrunk'],
      ['siptrunk_tif', 'tif', 'ttr_siptrunk'],
      ['dwdm_reg', 'reg', 'ttr_dwdm'],
      ['dwdm_tif', 'tif', 'ttr_dwdm'],
    ];

    for (const [file, jenis, table] of inputList) {
      await inputDataToDatabase(file, jenis, table);
    }

    await delete_ttr_datin_duplicate();
  } catch (err) {
    console.error('Error di main():', err);
  } finally {
    connection.end();
    console.log('Koneksi database ditutup.');
  }
}

main();
