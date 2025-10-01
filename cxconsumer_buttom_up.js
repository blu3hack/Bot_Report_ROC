const puppeteer = require('puppeteer');
const request = require('request-promise-native');
const path = require('path');
const fs = require('fs');
const http = require('http');
const req = require('request');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const rimraf = require('rimraf');
const { user_cx, pass_cx, api_2capcay } = require('./login');
const { exec } = require('child_process');
const { extractFull } = require('node-7z'); // Untuk extract ZIP dengan password
const mysql = require('mysql2/promise');
const readline = require('readline');

const apiKey = api_2capcay; // API key 2Captcha
const cookiesFilePath = __dirname + '/cookies/cookiesTelkomcare.json';

// Pastikan direktori dan file yang diperlukan ada
ensureDirSync(path.dirname(cookiesFilePath)); // Cek dan buat folder untuk cookies
ensureFileSync(cookiesFilePath); // Cek dan buat file cookies jika belum ada

const fullPathTo7z = 'C:\\Program Files\\7-Zip\\7z.exe'; // Sesuaikan dengan lokasi sebenarnya

const tempDirectory = './myTempData_dashboard_telkomcare_8050';
ensureDirSync(tempDirectory); // Cek dan buat folder temp

const downloadDirectory = './download_telkomcare_1/';
ensureDirSync(downloadDirectory); // Cek dan buat folder download

const extracDirectory = './extracted-files/';
ensureDirSync(extracDirectory); // Cek dan buat folder download

// Pastikan folder ada atau buat folder jika tidak ada
fs.mkdirSync(tempDirectory, { recursive: true });
fs.mkdirSync(downloadDirectory, { recursive: true });
fs.mkdirSync(extracDirectory, { recursive: true });

// Hapus isi folder
deleteFolderContents(tempDirectory);
deleteFolderContents(downloadDirectory);
deleteFolderContents(extracDirectory);

app.use(
  bodyParser.json({
    limit: '50mb',
  })
);
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000,
  })
);

function send(text) {
  try {
    var formData = {
      chat_id: '422427291',
      text: text,
    };
    request.post(
      {
        url: 'https://api.telegram.org/bot884701878:AAFRPfk37s5C52pYVKkCXJYaBd4G_HJCSek/sendMessage',
        formData: formData,
      },
      function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('upload failed:', err);
        }
      }
    );
  } catch (error) {
    console.error(error);
  }
}

// Fungsi untuk memastikan folder ada
function ensureDirSync(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true }); // Membuat direktori secara rekursif jika belum ada
  }
}

// Fungsi untuk memastikan file ada
function ensureFileSync(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, ''); // Membuat file kosong jika belum ada
  }
}

// Fungsi untuk menghapus isi folder
function deleteFolderContents(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Tidak dapat membaca folder ${folderPath}: ${err.message}`);
      return;
    }

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Tidak dapat membaca file ${filePath}: ${err.message}`);
          return;
        }

        if (stats.isDirectory()) {
          // Hapus folder secara rekursif jika item adalah folder
          deleteFolderContents(filePath);
          fs.rmdir(filePath, (err) => {
            if (err) console.error(`Tidak dapat menghapus folder ${filePath}: ${err.message}`);
          });
        } else {
          // Hapus file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Tidak dapat menghapus file ${filePath}: ${err.message}`);
            } else {
              console.log(`File dihapus: ${filePath}`);
            }
          });
        }
      });
    }
  });
}

// Fungsi untuk mengambil data (SELECT) dan mengecek usia OTP
async function getOtp() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Query untuk mengambil pesan dengan `insertat` terbaru
    const [rows] = await connection.execute('SELECT message, insertat FROM nonatero_download.`kode_otp` WHERE insertat = (SELECT MAX(insertat) FROM nonatero_download.`kode_otp`)');

    if (rows.length > 0) {
      const message = rows[0].message;
      const insertat = new Date(rows[0].insertat);
      const currentTime = new Date();

      // Cek apakah `insertat` lebih dari 30 menit yang lalu
      const timeDiff = Math.abs(currentTime - insertat) / (1000 * 60); // Selisih waktu dalam menit
      if (timeDiff > 30) {
        console.log('Insertat lebih dari 30 menit yang lalu, keluar dari browser.');
        await page.browser().close();
        process.exit(1); // Keluar dari program
      }

      console.log(message);

      // Ekstrak OTP dengan pola yang lebih spesifik (6 digit setelah teks "Your OTP Code is")
      const otpMatch = message.match(/Username 840168 OTP Code is (\d{6})/);

      if (otpMatch) {
        const otp = otpMatch[1]; // Mengambil OTP dari hasil regex
        return otp;
      } else {
        console.error('OTP tidak ditemukan dalam pesan.');
        return null;
      }
    } else {
      console.error('Tidak ada pesan yang ditemukan.');
      return null;
    }
  } catch (error) {
    console.error('Error saat mengambil OTP:', error);
    return null;
  } finally {
    connection.end(); // Tutup koneksi
  }
}

// Konfigurasi database
const dbConfig = {
  host: '10.110.13.56',
  user: 'root',
  password: 'Serverabc123#',
  database: 'perf_roc',
};

// Fungsi untuk membuat koneksi database sekali saja
let connection;
async function createConnection() {
  if (!connection) {
    connection = await mysql.createConnection(dbConfig);
  }
  return connection;
}

// Fungsi untuk menghapus data berdasarkan tanggal hari ini
async function deleteOldData(connection) {
  const deleteQuery = `
        DELETE FROM 
        perf_roc.telkomcare_wecare_sugar
        WHERE tgl = CURDATE()`;

  try {
    await connection.execute(deleteQuery);
    console.log('Data lama berhasil dihapus untuk tanggal hari ini.');
  } catch (error) {
    console.error('Error saat menghapus data lama:', error.message);
  }
}

// Fungsi untuk mengimpor data dari CSV ke MySQL menggunakan LOAD DATA INFILE
async function importDataWithInfile(connection, csvFilePath) {
  try {
    const query = `
            LOAD DATA LOCAL INFILE ?
            INTO TABLE perf_roc.telkomcare_wecare_sugar
            FIELDS TERMINATED BY ','
            LINES TERMINATED BY '\n'
            IGNORE 1 LINES
            (territory, gaul, tidak_ada_gaul, grand_total,
             target, real_value, ach, kawasan)
            SET tgl = CURDATE()`; // Set kolom `tgl` dengan tanggal saat ini

    await connection.query({
      sql: query,
      values: [csvFilePath],
      infileStreamFactory: (path) => fs.createReadStream(path), // StreamFactory untuk membaca file CSV
    });
    console.log('Data berhasil diimpor ke database dari file CSV.');

    const updateQuery = `
            UPDATE perf_roc.waktu_update_all 
            SET waktu_update = NOW() 
            WHERE penamaan = 'wecare'`;

    await connection.execute(updateQuery);
    console.log('Update waktu_update_all berhasil.');
  } catch (error) {
    console.error('Error saat mengimpor data:', error.message);
  }
}

// Fungsi untuk menyimpan data hasil scraping ke CSV
async function saveToCSV(tableData, csvFilePath) {
  const header = ['territory', 'gaul', 'tidak_ada_gaul', 'grand_total', 'target', 'real_value', 'ach', 'kawasan'];

  const csvContent = [header.join(',')];

  tableData.forEach((row) => {
    const values = [row.territory, row.gaul, row.tidak_ada_gaul, row.grand_total, row.target, row.real, row.ach, row.kawasan].map((val) => (val === undefined ? '' : val));

    csvContent.push(values.join(','));
  });

  fs.writeFileSync(csvFilePath, csvContent.join('\n'), 'utf-8');
  console.log(`Data berhasil disimpan ke ${csvFilePath}`);
}

// Modifikasi fungsi scrapeAndInsert
async function scrapeAndInsert(page) {
  const kawasanList = ['TELKOMLAMA', 'TIF'];
  const connection = await createConnection();

  await deleteOldData(connection);

  for (const kawasan of kawasanList) {
    console.log(`Mengambil data untuk kawasan: ${kawasan}`);

    await page.select('select[name="param_teritory"]', kawasan);
    await page.waitForTimeout(5000);

    const [button] = await page.$x('//b[contains(text(), "SUBMIT")]');
    if (button) {
      await button.click();
      console.log('Tombol "Submit" berhasil diklik.');
    } else {
      console.log('Tombol "Submit" tidak ditemukan.');
      continue;
    }

    try {
      let xpathSelector = '';

      if (kawasan === 'TELKOMLAMA') {
        xpathSelector = '//table[@id="profit"]//td[contains(text(), "REG-1")]';
      } else if (kawasan === 'TIF') {
        xpathSelector = '//table[@id="profit"]//td[contains(text(), "TERRITORY 1")]';
      }

      await page.waitForXPath(xpathSelector, { timeout: 7200000 });
      console.log(`Tulisan yang sesuai dengan kawasan ${kawasan} telah muncul di tabel`);
    } catch (error) {
      console.log(`Timeout menunggu tabel data untuk kawasan ${kawasan}.`);
      await page.screenshot({ path: `screenshot_error_${kawasan}.png` });
      continue;
    }

    const tableData = await page.evaluate((kawasan) => {
      const rows = Array.from(document.querySelectorAll('#profit tbody tr'));
      return rows.map((row) => {
        const cells = row.querySelectorAll('td');
        return {
          territory: cells[0]?.innerText.trim(),
          gaul: cells[1]?.innerText.replace(/,/g, ''),
          tidak_ada_gaul: cells[2]?.innerText.replace(/,/g, ''),
          grand_total: cells[3]?.innerText.replace(/,/g, ''),
          target: cells[4]?.innerText.replace(/,/g, ''),
          real: cells[5]?.innerText.replace(/,/g, ''),
          ach: cells[6]?.innerText.replace(/,/g, ''),
          kawasan: kawasan, // Tempatkan kawasan sebagai kolom terakhir
        };
      });
    }, kawasan);

    const csvFilePath = path.join(__dirname, `wecare_prabagen_data_${kawasan}.csv`);
    await saveToCSV(tableData, csvFilePath);
    await page.waitForTimeout(2000);

    await importDataWithInfile(connection, csvFilePath);
    await page.waitForTimeout(2000);
  }

  await connection.end();
}

// Tambahkan fungsi check_and_login
async function check_and_login(page, url) {
  if (fs.existsSync(cookiesFilePath)) {
    try {
      console.log('Reading cookies from file');
      const cookies = fs.readFileSync(cookiesFilePath, 'utf8');
      const deserializedCookies = JSON.parse(cookies);
      await page.setCookie(...deserializedCookies);
      console.log('Cookies set successfully');

      await page.waitForTimeout(5000);

      console.log('Navigating to URL to check cookies');
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 0,
      });

      console.log('Checking for home page element');
      const cekHome = await page.$x("//input[@id='search_global_nd']");
      await page.waitForTimeout(2500).catch((e) => void 0);
      if (cekHome.length > 0) {
        console.log('Login with cookies successful');
        await page.waitForTimeout(10000);
        return true;
      } else {
        console.log('Cookies are not valid, need to login');
        return false;
      }
    } catch (error) {
      console.log('Error reading cookies or navigating to page: ', error);
      return false;
    }
  } else {
    console.log('Cookies not found, proceeding with normal login');
    return false;
  }
}

async function solveCaptcha(page) {
  // Ambil gambar captcha dari halaman
  const captchaImage = await page.$('img[width="200"]');

  const captchaImagePath = path.join(__dirname, 'captcha.png');
  await captchaImage.screenshot({ path: captchaImagePath });

  console.log('Captcha image saved!');

  // Kirim gambar captcha ke 2Captcha
  const formData = {
    method: 'post',
    key: apiKey,
    file: fs.createReadStream(captchaImagePath),
    json: 1,
  };

  const response = await request.post({
    url: 'http://2captcha.com/in.php',
    formData: formData,
  });

  const captchaId = JSON.parse(response).request;
  console.log(`Captcha ID: ${captchaId}`);

  // Tunggu hasil captcha dari 2Captcha
  let solvedCaptcha = null;
  while (!solvedCaptcha) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Tunggu 5 detik

    const result = await request.get(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaId}&json=1`);
    const resultJson = JSON.parse(result);

    if (resultJson.status === 1) {
      solvedCaptcha = resultJson.request;
      console.log(`Captcha solved: ${solvedCaptcha}`);
    } else {
      console.log('Waiting for captcha result...');
    }
  }

  return solvedCaptcha;
}

async function getDataFromHighchartsTable(page) {
  try {
    // Tunggu sampai elemen tabel dengan kelas 'highcharts-data-table' muncul menggunakan XPath
    const [tableElement] = await page.$x("//div[contains(@class, 'highcharts-data-table')]");

    if (!tableElement) {
      console.log('Tabel Highcharts tidak ditemukan.');
      return [];
    }

    // Ambil konten tabel untuk memastikan tabel tersedia
    const tableHTML = await tableElement.evaluate((node) => node.innerHTML);
    console.log('Konten dari tabel Highcharts:', tableHTML);

    // Ambil data dari tabel
    const tableData = await page.evaluate(() => {
      const tableRows = document.querySelectorAll('div.highcharts-data-table tbody tr');
      const data = [];

      tableRows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');
        const kategori = cells[0]?.textContent?.replace(/<br.*?>/g, '').trim() || '';
        const promotor = parseInt(cells[1]?.textContent || '0', 10);
        const passive = parseInt(cells[2]?.textContent || '0', 10);
        const detractor = parseInt(cells[3]?.textContent || '0', 10);

        data.push({
          kategori,
          promotor,
          passive,
          detractor,
        });
      });

      return data;
    });

    console.log('Data dari tabel Highcharts:', tableData);
    return tableData;
  } catch (error) {
    console.error('Gagal mengambil data dari tabel Highcharts:', error);
    return [];
  }
}

function compareData(highchartsData, avgEpisodeData) {
  const comparisonResults = avgEpisodeData.map((avgData) => {
    const matchedData = highchartsData.find((chartData) => chartData.kategori.includes(avgData.kategori));

    return {
      kategori: avgData.kategori,
      nps: avgData.nps,
      responden: avgData.responden,
      promotor: matchedData?.promotor || 0,
      passive: matchedData?.passive || 0,
      detractor: matchedData?.detractor || 0,
    };
  });

  console.log('Hasil perbandingan:', comparisonResults);
  return comparisonResults;
}

async function run_programs(page) {
  console.log('sudah masuk >> run program');

  const url = 'https://cxconsumer.telkom.co.id/bottom-up';
  await page.goto(url, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 0,
  });

  // console.log("set tanggal sekarang");
  // await page.waitForTimeout(30000);

  // Buat koneksi ke database
  const conn = await createConnection();

  // Hapus data bulan ini dan tahun ini
  const now = new Date();
  let bulanIni = now.getMonth() + 1; // getMonth() dimulai dari 0 (Januari), jadi +1
  let tahunIni = now.getFullYear();

  const day = now.getDate();

  // Cek apakah hari ini adalah tanggal 1
  if (day === 2) {
    // Jika bulan sekarang adalah Januari, maka mundur ke Desember tahun sebelumnya
    if (bulanIni === 1) {
      bulanIni = 12;
      tahunIni -= 1;
    } else {
      bulanIni -= 1;
    }

    // Klik elemen dengan XPath pertama
    const element1 = await page.$x("//*[@id='tanggalrange']");
    if (element1.length > 0) {
      await element1[0].click();
    }

    // Klik elemen dengan XPath kedua
    const element2 = await page.$x("//li[contains(@data-range-key, 'Last Month') and text()='Last Month']");
    if (element2.length > 0) {
      await element2[0].click();
    }
  }

  console.log(`Bulan sebelumnya: ${bulanIni}, Tahun sebelumnya: ${tahunIni}`);

  try {
    const deleteQuery = `DELETE FROM nps_data WHERE bulan = ? AND tahun = ?`;
    await conn.execute(deleteQuery, [bulanIni, tahunIni]);
    console.log(`Data bulan ${bulanIni} dan tahun ${tahunIni} berhasil dihapus.`);
  } catch (error) {
    console.error('Gagal menghapus data bulan ini dan tahun ini:', error);
  }

  // Loop yang sudah ada, tetap berjalan
  try {
    const [districtResults] = await conn.execute(`SELECT DISTINCT DISTRICT FROM sto_sub_district`);

    for (let row of districtResults) {
      const district = row.DISTRICT;
      const [stoResults] = await conn.execute(`SELECT STO FROM sto_sub_district WHERE DISTRICT = ?`, [district]);
      const targetValues = stoResults.map((stoRow) => stoRow.STO);

      console.log(`Processing district: ${district} with target values:`, targetValues);

      await navigateAndProcess(page, targetValues);
      await processDataAndSaveToDB(page, conn, district, bulanIni, tahunIni);
    }
  } catch (error) {
    console.error('Gagal menjalankan query loop:', error);
  }

  // Proses query tambahan tanpa loop
  await processAdditionalDistricts(page, conn, bulanIni, tahunIni);

  console.log('all done');
  await page.waitForTimeout(1000);
  process.exit();
}

// Fungsi baru untuk menangani query tambahan
async function processAdditionalDistricts(page, conn, bulanIni, tahunIni) {
  // Query untuk DISTRICT 'tif3'
  try {
    const [stoResults] = await conn.execute(`SELECT * FROM sto_sub_district`);
    const targetValues = stoResults.map((stoRow) => stoRow.STO);

    console.log(`Processing additional district: tif3 with target values:`, targetValues);

    await navigateAndProcess(page, targetValues);
    await processDataAndSaveToDB(page, conn, 'tif3', bulanIni, tahunIni);
  } catch (error) {
    console.error('Gagal menjalankan query untuk DISTRICT tif3:', error);
  }

  // Query untuk DISTRICT 'treg5'
  try {
    const [stoResults] = await conn.execute(`
            SELECT * FROM sto_sub_district
            WHERE DISTRICT IN ('BALI','MALANG','NUSA TENGGARA','SIDOARJO','SURAMADU')
        `);
    const targetValues = stoResults.map((stoRow) => stoRow.STO);

    console.log(`Processing additional district: treg5 with target values:`, targetValues);

    await navigateAndProcess(page, targetValues);
    await processDataAndSaveToDB(page, conn, 'treg5', bulanIni, tahunIni);
  } catch (error) {
    console.error('Gagal menjalankan query untuk DISTRICT treg5:', error);
  }

  // Query untuk DISTRICT 'treg4'
  try {
    const [stoResults] = await conn.execute(`
            SELECT * FROM sto_sub_district
            WHERE DISTRICT NOT IN ('BALI','MALANG','NUSA TENGGARA','SIDOARJO','SURAMADU')
        `);
    const targetValues = stoResults.map((stoRow) => stoRow.STO);

    console.log(`Processing additional district: treg4 with target values:`, targetValues);

    await navigateAndProcess(page, targetValues);
    await processDataAndSaveToDB(page, conn, 'treg4', bulanIni, tahunIni);
  } catch (error) {
    console.error('Gagal menjalankan query untuk DISTRICT treg4:', error);
  }
}

async function navigateAndProcess(page, targetValues) {
  // const url = "https://cxconsumer.telkom.co.id/bottom-up";
  // await page.goto(url, {
  //     waitUntil: ["networkidle0", "domcontentloaded"],
  //     timeout: 0,
  // });

  await page.waitForTimeout(2000);

  await page.waitForSelector('body > div.wrapper.menu-open.active > div.content-wrapper.active > section.content.row > div:nth-child(1) > div > div.text-center.card-body.row > div:nth-child(2) > span:nth-child(1) > div > button > span', {
    visible: true,
    timeout: 7200000,
  });
  await page.click('body > div.wrapper.menu-open.active > div.content-wrapper.active > section.content.row > div:nth-child(1) > div > div.text-center.card-body.row > div:nth-child(2) > span:nth-child(1) > div > button > span');

  const allSelectAllCheckboxes = await page.$$('input.form-check-input[value="multiselect-all"]');
  if (allSelectAllCheckboxes.length >= 2) {
    const isChecked = await allSelectAllCheckboxes[1].evaluate((node) => node.checked);
    if (isChecked) {
      await allSelectAllCheckboxes[1].click();
    }
  }

  await page.waitForSelector('input.form-check-input[value="AREA 3"]', { visible: true, timeout: 7200000 });
  const area3Checkbox = await page.$('input.form-check-input[value="AREA 3"]');
  if (area3Checkbox) {
    const isChecked = await area3Checkbox.evaluate((node) => node.checked);
    if (!isChecked) {
      await area3Checkbox.click();
    }
  }

  await page.click('body > div.wrapper.menu-open.active > div.content-wrapper.active > section.content.row > div:nth-child(1) > div > div.card-header > h3');
  await page.waitForTimeout(1000);

  const [thirdButton] = await page.$x('(//button[contains(@class, "multiselect dropdown-toggle custom-select text-center")])[3]');
  if (thirdButton) {
    await thirdButton.click();
  }

  const allSelectAllCheckboxes_sto = await page.$$('input.form-check-input[value="multiselect-all"]');
  if (allSelectAllCheckboxes_sto.length >= 2) {
    const isChecked = await allSelectAllCheckboxes_sto[2].evaluate((node) => node.checked);
    if (isChecked) {
      await allSelectAllCheckboxes_sto[2].click();
    }
  }

  await page.waitForSelector('.multiselect-container');
  const multiselectContainers = await page.$$('.multiselect-container');

  if (multiselectContainers.length >= 2) {
    const secondContainer = multiselectContainers[2];

    for (let value of targetValues) {
      try {
        const button = await secondContainer.$(`button[title="${value}"]`);
        if (button) {
          await button.click();
          console.log(`Clicked button with title: ${value}`);
        } else {
          console.log(`Button with title: ${value} not found`);
        }
      } catch (error) {
        console.error(`Failed to click button with title: ${value}`, error);
      }
    }
  }

  await delay(1000); // Gantikan page.waitForTimeout(2000)

  await page.waitForSelector('#submitFilter', { visible: true });
  await page.click('#submitFilter');
  console.log('Tombol "Submit" berhasil diklik.');
  await page.waitForTimeout(8000);

  await page.waitForSelector('.highcharts-contextbutton', { visible: true });
  await page.click('.highcharts-contextbutton');
  await page.waitForXPath("//li[contains(text(), 'View data table')]", { visible: true });

  const [viewDataTable] = await page.$x("//li[contains(text(), 'View data table')]");
  if (viewDataTable) {
    await viewDataTable.click();
    console.log('Berhasil mengklik "View data table".');
  }

  const [thirdButton1] = await page.$x('(//button[contains(@class, "multiselect dropdown-toggle custom-select text-center")])[2]');
  if (thirdButton1) {
    await thirdButton1.click();
  }

  const [thirdButton11] = await page.$x('/html/body/div[1]/div[1]/section[2]/div[1]/div/div[2]/div[2]/span[1]/div/div/button[1]');
  if (thirdButton11) {
    await thirdButton11.click();
  }

  await page.click('body > div.wrapper.menu-open.active > div.content-wrapper.active > section.content.row > div:nth-child(1) > div > div.card-header > h3');
  await page.waitForTimeout(1000);

  const [thirdButton2] = await page.$x('(//button[contains(@class, "multiselect dropdown-toggle custom-select text-center")])[3]');
  if (thirdButton2) {
    await thirdButton2.click();
  }

  const [thirdButton21] = await page.$x('/html/body/div[1]/div[1]/section[2]/div[1]/div/div[2]/div[2]/span[2]/div/div/button[1]');
  if (thirdButton21) {
    await thirdButton21.click();
  }
}

async function processDataAndSaveToDB(page, conn, district, bulanIni, tahunIni) {
  // Tunggu elemen #avgEpisode muncul
  await page.waitForSelector('#avgEpisode', { visible: true });

  // Cetak HTML konten dari elemen #avgEpisode untuk memastikan sudah terambil
  const avgEpisodeContent = await page.evaluate(() => {
    const avgEpisodeElement = document.querySelector('#avgEpisode');
    return avgEpisodeElement ? avgEpisodeElement.innerHTML : 'Tidak ditemukan';
  });
  console.log('Konten dari #avgEpisode:', avgEpisodeContent);

  // Ambil data dari #avgEpisode
  const avgEpisodeData = await page.evaluate(() => {
    const episodeElements = document.querySelectorAll('#avgEpisode .small-box');
    const episodeData = [];

    episodeElements.forEach((el) => {
      const nps = el.querySelector('.inner h3')?.innerText || 'N/A';
      const kategori = el.querySelector('.inner p[style*="font-weight:bold"]')?.innerText || '';
      const respondenText = el.querySelector('.inner p[style*="margin-bottom: -10px"]')?.innerText || '';
      const responden = respondenText ? parseInt(respondenText.replace(/\D/g, ''), 10) : 0;

      episodeData.push({
        kategori,
        nps: nps === 'N/A' ? null : parseFloat(nps),
        responden,
      });
    });

    return episodeData;
  });

  console.log('Data dari avgEpisode:', avgEpisodeData);

  const highchartsData = await getDataFromHighchartsTable(page);
  console.log('Data dari tabel Highcharts:', highchartsData);

  const comparisonResults = compareData(highchartsData, avgEpisodeData);

  for (let result of comparisonResults) {
    try {
      const { kategori, nps, responden, promotor, passive, detractor } = result;

      const query = `
                INSERT INTO nps_data (tahun, bulan, district, kategori, nps, responden, promotor, passive, detractor, last_update) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
      await conn.execute(query, [tahunIni, bulanIni, district, kategori, nps, responden, promotor, passive, detractor]);
      console.log(`Data kategori '${kategori}' berhasil disimpan.`);
    } catch (error) {
      console.error(`Gagal menyimpan data kategori '${result.kategori}':`, error);
    }
  }
}

// Pengganti untuk page.waitForTimeout
async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function form_login(page) {
  await page.goto('https://cxconsumer.telkom.co.id/login', {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 0,
  });

  await delay(2000); // Gantikan page.waitForTimeout(2000)
  // Mulai login
  const cek1 = await page.$x("//*[@type='submit']");
  await delay(2500); // Gantikan page.waitForTimeout(2500)
  if (cek1.length === 0) {
    console.log('Masuk halaman login gagal');
    return false;
  } else {
    console.log('LOGIN WITH EMAIL');

    // const element = await page.$("#agree");
    // const isCheckBoxChecked = await (await element.getProperty("checked")).jsonValue();
    // if (!isCheckBoxChecked) {
    //     await element.click();
    // }

    await page.type('[name="email"]', user_cx);
    await page.type('[name="password"]', pass_cx);

    // const captchaResult = await solveCaptcha(page);
    // if (!captchaResult) {
    //     console.log("Captcha gagal diproses.");
    //     return false;
    // }

    // await page.type('[name="captcha[input]"]', captchaResult);

    await delay(2000); // Gantikan page.waitForTimeout(2000)
    console.log('Klik Login');

    const [button] = await page.$x("//*[@type='submit']");
    if (button) {
      await Promise.all([
        button.click(),
        console.log('CLICK Log In to page capcay OK'),
        page
          .waitForNavigation({
            waitUntil: 'networkidle0',
            timeout: 0,
          })
          .catch((e) => console.log('Error saat menunggu navigasi:', e)),
      ]);
    }

    await delay(5000); // Gantikan page.waitForTimeout(5000)
    const cek2 = await page.$x("//input[@id='search_global_nd']");
    await delay(2500); // Gantikan page.waitForTimeout(2500)

    if (cek2.length === 0) {
      console.log('Login Gagal');
      return false;
    } else {
      console.log('Login berhasil');
      const saveCookies = await page.cookies();
      const saveCookieJson = JSON.stringify(saveCookies);
      fs.writeFileSync(cookiesFilePath, saveCookieJson);
      return true;
    }
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: path.join(__dirname, 'user_data_8031'),
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=8031', // Port untuk browser
    ],
    defaultViewport: {
      width: 1224, // Ganti sesuai dengan lebar layar laptop Anda
      height: 1080, // Ganti sesuai dengan tinggi layar laptop Anda
    },
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  const client_3 = await page.target().createCDPSession();
  await client_3.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve(__dirname, downloadDirectory),
  });

  const url = 'https://cxconsumer.telkom.co.id/bottom-up';

  const maxAttempts = 5;
  let loggedIn = false;
  let attempts = 0;

  // Cek cookies dan login jika perlu
  loggedIn = await check_and_login(page, url);
  while (!loggedIn && attempts < maxAttempts) {
    attempts++;
    send(`Attempt nona ${attempts}`);
    console.log(`Attempt ${attempts}`);
    loggedIn = await form_login(page);
    if (!loggedIn) {
      console.log('Login attempt failed, retrying...');
      await page.waitForTimeout(3000);
    }
  }

  if (loggedIn) {
    await run_programs(page);
  } else {
    send('Login nona gagal 5x');
    await page.waitForTimeout(5000);
    console.log('Max login attempts reached. Login failed.');
    await browser.close();
    process.exit(1);
  }
})();

// set port
app.listen(8031, function () {
  console.log('Node app is running on port 8031');
});
module.exports = app;
