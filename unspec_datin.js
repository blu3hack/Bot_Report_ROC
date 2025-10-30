const puppeteer = require('puppeteer');
const connection = require('./connection');
const { user_care, pass_care } = require('./login');
const { exec } = require('child_process');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigasi ke halaman login
    await page.goto('https://assurance.telkom.co.id/ebis/index.php/login/index/');

    // Screenshoot cpt
    const element = await page.$('#mtLogin > div:nth-child(4) > img'); // ganti #main dengan id target
    if (element) {
      await element.screenshot({
        path: 'captcha/cpt.png',
      });
    } else {
      console.log('? Elemen dengan id tersebut tidak ditemukan');
    }

    // // mbil cpacha dari database
    function getData() {
      return new Promise((resolve, reject) => {
        const query = "SELECT pesan FROM get_otp_for_download WHERE pesan LIKE '%cpt%' ORDER BY id DESC LIMIT 1";
        connection.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    }

    // Isi formulir login
    await page.type('[placeholder="Username"]', user_care);
    await page.type('[placeholder="Password"]', pass_care);
    await page.waitForTimeout(10000);
    await page.click('#mtLogin > div:nth-child(5) > button');

    async function getOTP() {
      return new Promise((resolve, reject) => {
        exec('python otp_ebis.py', (error, stdout, stderr) => {
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
    await page.waitForTimeout(3000);

    async function insertOTP() {
      const otp = await getOTP();
      console.log('OTP yang didapat:', otp);
      await page.type('[placeholder="Token Google"]', otp);
      await page.click('#mtGoogleAuth > div:nth-child(6) > button');
    }
    await insertOTP();

    // Proses Pengambilan Data setelah login
    async function goToLinkByXPath(xpath) {
      await page.waitForXPath(xpath);
      const links = await page.$x(xpath);
      if (links.length > 0) {
        const linkUrl = await page.evaluate((link) => link.href, links[0]);
        await page.goto(linkUrl, { waitUntil: 'networkidle2', timeout: 5000 }).catch((e) => void 0);
      }
    }

    async function segmen_gamas_akses() {
      await goToLinkByXPath("//a[contains(., 'Report Performansi Draft Underspec')]");
    }

    async function unspec_datin() {
      console.log('============== Underspec Datin ===============');
      await page.waitForTimeout(5000);
      await segmen_gamas_akses();

      async function datin_unspec(group, regional, nama_file) {
        await page.waitForTimeout(5000);
        await page.evaluate(() => {
          [...document.querySelectorAll('a.btn.wrn-gradasi')].find((el) => el.textContent.trim() === 'Filter')?.click();
        });

        // Tunggu modal filter muncul
        await page.waitForSelector('#grup_teritori', { visible: true, timeout: 10000 });

        // Pilih Group territory
        await page.select('#grup_teritori', await page.$eval(`#grup_teritori option:nth-child(${group})`, (el) => el.value));
        await page.waitForTimeout(2000);

        // Pilih Territory
        await page.waitForSelector('#regional', { visible: true });
        await page.select('#regional', await page.$eval(`#regional option:nth-child(${regional})`, (el) => el.value));
        await page.waitForTimeout(2000);

        // Pilih Product
        await page.waitForSelector('#_____produk', { visible: true });
        await page.select('#_____produk', await page.$eval('#_____produk option:nth-child(1)', (el) => el.value));
        await page.waitForTimeout(2000);

        // Pilih Bulan
        await page.waitForSelector('#periodeValue', { visible: true });
        await page.select('#periodeValue', await page.$eval('#periodeValue > option:nth-child(1)', (el) => el.value));
        await page.waitForTimeout(2000);

        // Klik Terapkan Filter dan tunggu reload
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          page.evaluate(() => {
            [...document.querySelectorAll('button.btn.wrn-gradasi')].find((el) => el.textContent.trim() === 'Filter')?.click();
          }),
        ]);

        // Tunggu tabel hasil muncul
        await page.waitForSelector('table tbody', { visible: true, timeout: 20000 });

        // Ambil data tabel
        const unspec_datin = await page.evaluate(() => {
          const table = document.querySelector('table tbody');
          if (!table) return 'Tabel tidak ditemukan';
          return Array.from(table.querySelectorAll('tr'))
            .map((row) =>
              Array.from(row.querySelectorAll('td, th'))
                .map((col) => col.innerText.trim().replace(/,/g, '')) // Hapus koma di dalam isi sel
                .join(',')
            )
            .join('\n');
        });

        console.log(unspec_datin);
        fs.writeFileSync(`loaded_file/unspec_datin/unspec_${nama_file}.csv`, unspec_datin);
        console.log(`unspec_${nama_file} berhasil didownload \n`);
      }

      await datin_unspec(3, 1, 'tif');
      await datin_unspec(3, 4, 'district');
      await datin_unspec(1, 1, 'reg');
      await datin_unspec(1, 5, 'reg4');
      await datin_unspec(1, 6, 'reg5');
    }

    await unspec_datin();
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
  } finally {
    await browser.close();
  }
})();
