const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { user_care, pass_care } = require('./login');
const { exec } = require('child_process');
const path = require('path');
const { extractFull } = require('node-7z');
// const connection = require('./db_connection');
// const mysql = require('mysql2/promise');
const mysql = require('mysql2');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Buka browser (non-headless)
  const page = await browser.newPage();

  // Navigasi ke halaman login
  await page.goto('https://nonatero.telkom.co.id/wsa/index.php/dashboard/');

  // Isi formulir login
  await page.type('[placeholder="Enter your Nik or username"]', user_care);
  await page.type('[placeholder="············"]', pass_care);
  page.$x("//a[contains(., 'Wallboard')]");

  const checkboxSelector = '#ck-terms-of-use';
  const isChecked = await page.$eval(checkboxSelector, (checkbox) => checkbox.checked);

  // Jika belum dicentang, klik untuk mencentangnya
  if (!isChecked) {
    await page.click(checkboxSelector);
    console.log('Checkbox berhasil diklik!');
  } else {
    console.log('Checkbox sudah dicentang.');
  }
  // Klik tombol login
  await page.click('#formAuthentication > button');
  // ================== INPUT OTP =====================
  async function getCaptchaFromDatabase() {
    return new Promise((resolve, reject) => {
      exec('python otp.py', (error, stdout, stderr) => {
        if (error) {
          console.error(`Terjadi kesalahan: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return reject(stderr);
        }

        const otp = stdout.trim();
        console.log(`OTP dari Python: ${otp}`); // Pastikan OTP valid di sini
        resolve(otp);
      });
    });
  }

  async function insertOTP() {
    const code_otp = await getCaptchaFromDatabase();
    const code1 = Math.floor(code_otp / 100000) % 10;
    const code2 = Math.floor(code_otp / 10000) % 10;
    const code3 = Math.floor(code_otp / 1000) % 10;
    const code4 = Math.floor(code_otp / 100) % 10;
    const code5 = Math.floor(code_otp / 10) % 10;
    const code6 = code_otp % 10;

    console.log(code1, code2, code3, code4, code5, code6);

    await page.type('#gg_otp > div > input.sscrt.scrt-1', code1.toString());
    await page.waitForTimeout(50);

    await page.type('#gg_otp > div > input.sscrt.scrt-2', code2.toString());
    await page.waitForTimeout(50);

    await page.type('#gg_otp > div > input.sscrt.scrt-3', code3.toString());
    await page.waitForTimeout(50);

    await page.type('#gg_otp > div > input.sscrt.scrt-4', code4.toString());
    await page.waitForTimeout(50);

    await page.type('#gg_otp > div > input.sscrt.scrt-5', code5.toString());
    await page.waitForTimeout(50);

    await page.type('#gg_otp > div > input.sscrt.scrt-6', code6.toString());
    await page.waitForTimeout(50);

    // Klik tombol login
    await page.click('#gg_otp > input.btn.btn-primary.mb-3');
    await page.waitForNavigation();
  }

  await page.waitForTimeout(3000);

  await insertOTP();

  async function goToLinkByXPath(xpath) {
    await page.waitForXPath(xpath);
    const links = await page.$x(xpath);
    if (links.length > 0) {
      const linkUrl = await page.evaluate((link) => link.href, links[0]);
      await page.goto(linkUrl, { waitUntil: 'networkidle2', timeout: 5000 }).catch((e) => void 0);
    }
  }

  async function file_download() {
    await goToLinkByXPath("//a[contains(., 'File Downlod')]");
  }

  async function download_file() {
    await file_download();
    await segmen();

    // tentukan directory path untuk menyimpan hasil download
    const downloadPath = 'D:\\SCRAPPERS\\Scrapper\\file_download';
    await page._client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    });

    const varname = ['open', 'close'];
    const regional = ['reg4', 'reg5'];
    const indexReg = [5, 6];
    const indexVar = [3, 4];

    for (i = 0; i < indexReg.length; i++) {
      for (j = 0; j < indexVar.length; j++) {
        const tombol = `body > div.layout-wrapper.layout-navbar-full.layout-horizontal.layout-without-menu > div > div > div > div.container-xxl.flex-grow-1.container-p-y > div > div > div > table > tbody > tr:nth-child(${indexReg[i]}) > td:nth-child(${indexVar[j]}) > a`;
        await page.waitForSelector(tombol);
        await page.click(tombol);
        await page.waitForTimeout(20000);

        // Ambil OTP password dan masukkan ke database extraction
        fileName = `${varname[j]}_${regional[i]}`;
        console.log(fileName);
        const connection = mysql.createConnection({
          host: '10.110.13.43',
          user: 'cxmention',
          password: 'tr5ju4r4#',
          database: 'perf_tif',
        });

        // Membuka koneksi ke database
        connection.connect((err) => {
          if (err) {
            console.error('Error connecting to database:', err.message);
            return;
          }
        });

        // Query untuk mengambil data dengan filter
        const keyword = 'password file anda';
        const query = 'SELECT message FROM bot_message WHERE message LIKE ?';
        connection.query(query, [`%${keyword}%`], (err, results) => {
          if (err) {
            console.error('Error executing query:', err.message);
            return;
          }
          results.forEach((row) => {
            const match = row.message.match(/\d+/); // Ekstrak angka pertama dalam string
            if (match) {
              const extractedNumber = match[0];
              // Query untuk menyisipkan data ke tabel otp_for_extract
              const queryInsert = 'INSERT INTO otp_for_extract (message, otp) VALUES (?, ?)';
              connection.query(queryInsert, [fileName, extractedNumber], (err, result) => {
                if (err) {
                  console.error('Error inserting data:', err.message);
                  return;
                }
              });
            } else {
              console.log('No number found in message:', row.message);
            }
          });

          // Tutup koneksi setelah query selesai
          connection.end((endErr) => {
            if (endErr) {
              console.error('Error closing the connection:', endErr.message);
              return;
            }
          });
        });
      }
    }
    console.log('Proses Download Selesai Tunggu Beberapa Saat Sebelum CLose');
    await page.waitForTimeout(20000);
    await browser.close();
    // connection.end();
  }

  async function segmen() {
    // const fil2 = await page.$('a.btn.wrn-gradasi');
    // await fil2.evaluate((fil2) => fil2.click());

    const selectLokasi = '#company_dwld';
    const lokasiValue = 'TELKOM-OLD';
    await page.waitForSelector(selectLokasi);
    await page.evaluate(
      (selectLokasi, lokasiValue) => {
        const selectElement = document.querySelector(selectLokasi);
        if (selectElement) {
          selectElement.value = lokasiValue;
          const event = new Event('change', { bubbles: true });
          selectElement.dispatchEvent(event);
        }
      },
      selectLokasi,
      lokasiValue
    );
    await page.waitForTimeout(3000);

    const selectSelector = '#periode';
    const optionValue = '202509';
    await page.waitForSelector(selectSelector);
    await page.evaluate(
      (selectSelector, optionValue) => {
        const selectElement = document.querySelector(selectSelector);
        if (selectElement) {
          selectElement.value = optionValue;
          const event = new Event('change', { bubbles: true });
          selectElement.dispatchEvent(event);
        }
      },
      selectSelector,
      optionValue
    );
    await page.waitForTimeout(3000);

    const [button] = await page.$x("//button[contains(., 'Filter')]");
    if (button) {
      await Promise.all([
        button.click(),
        page
          .waitForNavigation({
            waitUntil: 'load',
            timeout: 0,
          })
          .catch((e) => void 0),
      ]);
    }
  }

  download_file();
})();
