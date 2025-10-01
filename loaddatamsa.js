const fs = require('fs');
const mysql = require('mysql2');

// Buat koneksi
const connection = mysql.createConnection({
  host: '10.110.13.43',
  user: 'cxmention',
  password: 'tr5ju4r4#',
  database: 'perf_tif',
});

// Lokasi file CSV
const csvPath = 'D:/SCRAPPERS/Scrapper/loaded_file/msa_upload/msa_upload.csv';
// Query dengan streamFactory
const query = `
  LOAD DATA LOCAL INFILE 'msa_upload.csv'
  INTO TABLE msa_upload
  FIELDS TERMINATED BY ',' 
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n'
  IGNORE 1 ROWS
  (kpi, lokasi, Area, Realisasi, insert_at, bulan)
`;

// Jalankan query dengan streamFactory
connection.query(
  {
    sql: query,
    infileStreamFactory: () => fs.createReadStream(csvPath),
  },
  (err, results) => {
    if (err) {
      console.error('Gagal mengimpor CSV:', err);
    } else {
      console.log('Impor CSV berhasil:', results);
    }
    connection.end();
  }
);
