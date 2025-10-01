const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const { extractFull } = require('node-7z');
const connection = require('./connection');
// const mysql = require('mysql2/promise');
const mysql = require('mysql2');

(async () => {
  // Proses Extractor file =====================
  async function ExtractAndLoadFileToDatabase() {
    async function extracted_file() {
      function check7zip() {
        return new Promise((resolve, reject) => {
          exec('7z', (error) => {
            if (error) {
              reject(new Error('7-Zip is not installed or not found in PATH. Please install it and ensure it is accessible.'));
            } else {
              resolve();
            }
          });
        });
      }

      // Fungsi untuk mengekstrak file ZIP dengan password
      async function extractFile(zipFilePath, outputDir, password) {
        try {
          await check7zip();

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const extraction = extractFull(zipFilePath, outputDir, {
            password: password,
          });

          extraction.on('progress', (progress) => {
            console.log(`Extraction progress: ${progress.percent}%`);
          });

          extraction.on('end', () => {
            // console.log(`Extraction complete! Files extracted to: ${outputDir}`);
          });

          extraction.on('error', (err) => {
            console.error(`Error during extraction: ${err}`);
          });
        } catch (err) {
          console.error(`Error during extraction: ${err.message}`);
        }
      }

      // Fungsi utama untuk menjalankan proses ekstraksi
      async function main() {
        try {
          // Ambil OTP dari database
          const treg = ['reg4', 'reg5'];
          const message = ['open', 'close'];

          for (let i = 0; i < treg.length; i++) {
            for (let j = 0; j < message.length; j++) {
              const otp = await new Promise((resolve, reject) => {
                const query = 'SELECT otp FROM otp_for_extract WHERE message = ?';
                connection.query(query, [`${message[j]}_${treg[i]}`], (err, results) => {
                  if (err) {
                    return reject(err);
                  }

                  if (results.length === 0) {
                    return reject(new Error('No OTP found for the given message.'));
                  }

                  resolve(results[0].otp);
                });
              });

              // membaca nama file yang ada di directory
              const folder = 'file_download/';
              const files = fs.readdirSync(folder);
              const fileName = files.find((file) => file !== '.' && file !== '..' && file.includes(`${message[j]}`) && file.includes(`${treg[i]}`)) || 'No valid files found';

              if (fileName === 'No valid files found') {
                console.error('No file found for the specified criteria');
                continue; // Skip to the next iteration if no file is found
              }

              console.log(fileName);

              const zipFilePath = path.join(__dirname, 'file_download', fileName); // Ganti dengan path file ZIP Anda
              const outputDir = path.join(__dirname, 'extracted'); // Direktori tujuan ekstraksi
              const password = otp; // Menggunakan OTP sebagai password
              await extractFile(zipFilePath, outputDir, password);
            }
          }
        } catch (error) {
          console.error(`Error in main: ${error.message}`);
        } finally {
          connection.end();
        }
      }
      // Eksekusi fungsi utama
      main().catch(console.error);
    }
    await extracted_file();
  }
  ExtractAndLoadFileToDatabase();
})();
