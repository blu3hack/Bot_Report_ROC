const connection = require('./connection');
const fs = require('fs');
const path = require('path');

const query = 'DELETE FROM perf_tif.otp_for_extract';
connection.query(query, (error, results) => {
  if (error) {
    console.error('Terjadi kesalahan saat menghapus data:', error.message);
    return;
  } else {
    console.log('Data OTP berhasil dihapus');
  }
});

function clearFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Gagal membaca folder: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Gagal membaca file: ${err.message}`);
          return;
        }

        if (stats.isDirectory()) {
          fs.rm(filePath, { recursive: true, force: true }, (err) => {
            if (err) {
              console.error(`Gagal menghapus folder: ${err.message}`);
            }
          });
        } else {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Gagal menghapus file: ${err.message}`);
            }
          });
        }
      });
    });
  });
}

clearFolder('./extracted');
clearFolder('./extracted-files');
clearFolder('./file_download');
connection.end();
