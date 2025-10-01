const fs = require('fs');
const path = require('path');
const connection = require('./connection');
const csv = require('csv-parser');
const { insertDate } = require('../currentDate');

const table = ['kpi_endstate_monthly_reg', 'kpi_endstate_monthly_tif'];

async function deleteTables() {
  for (const tbl of table) {
    await new Promise((resolve, reject) => {
      const query = `DELETE FROM ${tbl}`;
      connection.query(query, (error, results) => {
        if (error) {
          console.error(`Gagal menghapus data di tabel ${tbl}:`, error);
          reject(error);
        } else {
          console.log(`Berhasil menghapus table ${tbl}`);
          resolve(results);
        }
      });
    });
  }
}

async function fulfillment_ih_reg() {
  const filePath = path.join(__dirname, 'wsa', 'wsa_fulfillment_reg.csv').replace(/\\/g, '/');
  const query = `
    LOAD DATA LOCAL INFILE ?
    INTO TABLE kpi_endstate_monthly_reg
    FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
    LINES TERMINATED BY '\\n'
    (blank, lokasi, tti_comply, tti_not_comply, tti_ps_ih, tti_real, tti_ach, ffg_comply, ffg_not_comply, ffg_jml_ps, ffg_real, ffg_ach, ttr_ffg_comply, ttr_ffg_not_comply, ttr_ffg_ggn_wsa, ttr_ffg_real, ttr_ffg_ach, ttr_ffg_wilsus, ttr_ffg_ggn)
    SET insert_at = CURRENT_TIMESTAMP;
  `;

  await new Promise((resolve, reject) => {
    connection.query(
      {
        sql: query,
        values: [filePath],
        infileStreamFactory: (path) => fs.createReadStream(path),
      },
      (err) => {
        if (err) return reject(err);
        console.log(`wsa_fulfillment_reg.csv Berhasil Di input ke Database`);
        resolve();
      }
    );
  });

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
    'ACEH',
    'BABEL',
    'BENGKULU',
    'JAMBI',
    'LAMPUNG',
    'MEDAN',
    'RIDAR',
    'RIKEP',
    'SUMBAR',
    'SUMSEL',
    'SUMUT',
    'BANTEN',
    'BEKASI',
    'BOGOR',
    'JAKBAR',
    'JAKPUS',
    'JAKSEL',
    'JAKTIM',
    'JAKUT',
    'TANGERANG',
    'BANDUNG',
    'BANDUNG BARAT',
    'CIREBON',
    'KARAWANG',
    'SUKABUMI',
    'TASIKMALAYA',
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
    'BALIKPAPAN',
    'KALBAR',
    'KALSEL',
    'KALTARA',
    'KALTENG',
    'SAMARINDA',
    'GORONTALO',
    'MAKASSAR',
    'MALUKU',
    'PAPUA',
    'PAPUA BARAT',
    'SULSELBAR',
    'SULTENG',
    'SULTRA',
    'SULUTMALUT',
  ];

  const whereClause = searchStrings.map(() => 'lokasi NOT LIKE ?').join(' AND ');
  const sql = `DELETE FROM kpi_endstate_monthly_reg WHERE ${whereClause}`;

  await new Promise((resolve, reject) => {
    connection.query(sql, searchStrings, (err, results) => {
      if (err) return reject(err);
      console.log(`Deleted ${results.affectedRows} rows dari kpi_endstate_monthly_reg`);
      resolve();
    });
  });
}

async function fulfillment_ih_tif() {
  const filePath = path.join(__dirname, 'wsa', 'wsa_fulfillment_tif.csv').replace(/\\/g, '/');
  const query = `
    LOAD DATA LOCAL INFILE ?
    INTO TABLE kpi_endstate_monthly_tif
    FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
    LINES TERMINATED BY '\\n'
    (blank, lokasi, tti_comply, tti_not_comply, tti_ps_ih, tti_real, tti_ach, ffg_comply, ffg_not_comply, ffg_jml_ps, ffg_real, ffg_ach, ttr_ffg_comply, ttr_ffg_not_comply, ttr_ffg_ggn_wsa, ttr_ffg_real, ttr_ffg_ach, ttr_ffg_wilsus, ttr_ffg_ggn);
  `;

  await new Promise((resolve, reject) => {
    connection.query(
      {
        sql: query,
        values: [filePath],
        infileStreamFactory: (path) => fs.createReadStream(path),
      },
      (err) => {
        if (err) return reject(err);
        console.log(`wsa_fulfillment_tif.csv Berhasil Di input ke Database`);
        resolve();
      }
    );
  });

  const searchStrings = [
    'TERRITORY 1',
    'ACEH',
    'LAMPUNG',
    'SUMBAGTENG',
    'SUMBAR',
    'SUMSEL',
    'SUMUT',
    'TERRITORY 2',
    'BANDUNG',
    'BANTEN',
    'BEKASI',
    'BOGOR',
    'CIREBON',
    'JAKBAR',
    'JAKCENTRUM',
    'JAKTIM',
    'TERRITORY 3',
    'BALI',
    'MALANG',
    'NUSA TENGGARA',
    'SEMARANG',
    'SIDOARJO',
    'SOLO',
    'SURAMADU',
    'YOGYAKARTA',
    'TERRITORY 4',
    'BALIKPAPAN',
    'KALBAR',
    'KALSELTENG',
    'KALTIMTARA',
    'PAPUA',
    'PAPUA BARAT',
    'SULBAGSEL',
    'SULBAGTENG',
    'SUMALUT',
  ];
  const whereClause = searchStrings.map(() => 'lokasi NOT LIKE ?').join(' AND ');
  const sql = `DELETE FROM kpi_endstate_monthly_tif WHERE ${whereClause}`;

  await new Promise((resolve, reject) => {
    connection.query(sql, searchStrings, (err, results) => {
      if (err) return reject(err);
      console.log(`Deleted ${results.affectedRows} rows dari kpi_endstate_monthly_tif`);
      resolve();
    });
  });
}

async function main() {
  try {
    await deleteTables();
    await fulfillment_ih_reg();
    await fulfillment_ih_tif();
    console.log('Program selesai.');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    connection.end();
  }
}

main();
