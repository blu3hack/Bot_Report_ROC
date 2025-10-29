/*
Versi modifikasi: menambahkan puppeteer-extra + stealth plugin ke skrip Anda.
Cara pakai:
1. Instal paket: npm i puppeteer-extra puppeteer-extra-plugin-stealth puppeteer axios sharp csv-parser node-telegram-bot-api mysql2
2. Simpan file ini (mis. wsa_stealth_puppeteer.js) dan jalankan: node wsa_stealth_puppeteer.js

Catatan: saya sebisa mungkin mempertahankan struktur kode asli Anda — hanya menambahkan stealth dan beberapa opsi agar lebih "human-like".
*/

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const csv = require('csv-parser');
const { secureHeapUsed } = require('crypto');
const { user_care, pass_care } = require('./login');
const { exec } = require('child_process');
const axios = require('axios');
const sharp = require('sharp');
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2/promise');
// const connection = require('./db_connection');
const { periode_long_format } = require('./currentDate');

(async () => {
  // opsi launch tambahan untuk mengurangi fingerprint
  const browser = await puppeteer.launch({
    headless: false, // agar terlihat (sama seperti skrip Anda)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      // beberapa flag yang sering dipakai
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  // atur user agent mirip browser nyata
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Nonaktifkan property webdriver pada navigator
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // --- Sisa kode Anda tetap, dengan sedikit penyesuaian untuk kompatibilitas ---

  // ambil capcute
  await page.goto('https://nonatero.telkom.co.id/wsa/index.php/login', { waitUntil: 'networkidle2' });

  // Isi formulir login
  const randomDelay = (min = 50, max = 150) => Math.floor(Math.random() * (max - min + 1)) + min;

  console.log('Memulai pengetikan Username...');
  await page.type('[placeholder="Enter your Nik or username"]', user_care, {
    delay: randomDelay(80, 180),
  });

  await page.waitForTimeout(randomDelay(500, 1500));

  console.log('Memulai pengetikan Password...');
  await page.type('[placeholder="············"]', pass_care, {
    delay: randomDelay(60, 160),
  });

  await page.waitForTimeout(randomDelay(1000, 3000));

  const checkboxSelector = '#ck-terms-of-use';
  const checkboxElement = await page.$(checkboxSelector);
  if (checkboxElement) {
    const box = await checkboxElement.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    }
  }

  const isChecked = await page.$eval(checkboxSelector, (checkbox) => checkbox.checked);

  if (!isChecked) {
    await page.waitForTimeout(randomDelay(100, 500));
    await page.click(checkboxSelector);
    console.log('Checkbox berhasil diklik (secara manusiawi)!');
  } else {
    console.log('Checkbox sudah dicentang.');
  }

  console.log('Mengklik tombol Login...');
  const loginButtonSelector = '#formAuthentication > button';

  const loginButtonElement = await page.$(loginButtonSelector);
  if (loginButtonElement) {
    const box = await loginButtonElement.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    }
  }
  await page.waitForTimeout(randomDelay(500, 1500));

  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.click(loginButtonSelector)]);

  // ================== INPUT OTP =====================
  async function getCaptchaFromDatabase() {
    return new Promise((resolve, reject) => {
      exec('python otp_840168.py', (error, stdout, stderr) => {
        if (error) {
          console.error(`Terjadi kesalahan: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return reject(stderr);
        }

        const otp = stdout.trim();
        console.log(`OTP dari Python: ${otp}`);
        resolve(otp);
      });
    });
  }
  await page.waitForTimeout(3000);

  async function insertOTP() {
    console.log('Memulai proses OTP...');
    await page.waitForTimeout(randomDelay(3000, 7000));

    const code_otp = await getCaptchaFromDatabase();
    const otpArray = String(code_otp).split('');

    console.log('Memasukkan OTP secara bertahap:', otpArray.join(''));

    await page.waitForSelector('#gg_otp > div > input.sscrt.scrt-1', { timeout: 15000 });

    for (let i = 0; i < otpArray.length; i++) {
      const selector = `#gg_otp > div > input.sscrt.scrt-${i + 1}`;
      const digitDelay = randomDelay(50, 150);
      await page.type(selector, otpArray[i], { delay: digitDelay });
      await page.waitForTimeout(randomDelay(20, 80));
    }

    await page.waitForTimeout(randomDelay(1500, 3500));

    console.log('Mengklik tombol Verifikasi OTP...');
    const verifyButtonSelector = '#gg_otp > input.btn.btn-primary.mb-3';

    const verifyButtonElement = await page.$(verifyButtonSelector);
    if (verifyButtonElement) {
      const box = await verifyButtonElement.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
      }
    }
    await page.waitForTimeout(randomDelay(300, 800));

    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch((e) => void 0), page.click(verifyButtonSelector)]);
    console.log('Verifikasi OTP berhasil. Navigasi ke Dashboard.');
  }

  await insertOTP();
  await page.waitForTimeout(10000);

  async function goToLinkByXPath(xpath) {
    await page.waitForXPath(xpath);
    const links = await page.$x(xpath);
    if (links.length > 0) {
      const linkUrl = await page.evaluate((link) => link.href, links[0]);
      await page.goto(linkUrl, { waitUntil: 'networkidle2', timeout: 5000 }).catch((e) => void 0);
    }
  }

  async function segmen_gamas_akses() {
    await goToLinkByXPath("//a[contains(., 'Segmen Gamas Akses')]");
  }

  async function ttr36() {
    await goToLinkByXPath("//a[. = 'TTR']");
  }

  async function service_a() {
    await goToLinkByXPath("//a[contains(., 'Service Availability')]");
  }
  async function sugar() {
    await goToLinkByXPath("//a[contains(., 'Assurance Guarantee')]");
  }

  async function ttr3_diamond() {
    await goToLinkByXPath("//a[. = 'TTR']");
  }

  async function AsrGuarantee() {
    console.log('============== Assurance Guarantee WSA ===============');
    // await sugar();

    async function sugar_assurance(company, regional, witel, nama_file) {
      const periode_selector = '#periodeValue';
      const option_periode_Selector = '#periodeValue > option:nth-child(1)';
      await page.waitForSelector(periode_selector);
      await page.evaluate(
        (periode_selector, option_periode_Selector) => {
          const selectElement = document.querySelector(periode_selector);
          const optionElement = document.querySelector(option_periode_Selector);
          if (selectElement && optionElement) {
            selectElement.value = optionElement.value;
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
          }
        },
        periode_selector,
        option_periode_Selector
      );

      await page.waitForSelector('#company');
      await page.click('#company');

      await page.evaluate((company) => {
        const optionElement = document.querySelector(`#company > option:nth-child(${company})`);
        if (optionElement) {
          optionElement.selected = true;
          const selectElement = optionElement.parentElement;
          selectElement.dispatchEvent(new Event('change'));
        } else {
          console.error('Elemen <option> tidak ditemukan.');
        }
      }, company);
      await page.waitForTimeout(3000);

      await page.waitForSelector('#regional');
      await page.click('#regional');

      await page.evaluate((regional) => {
        const optionElement = document.querySelector(`#regional > option:nth-child(${regional})`);
        if (optionElement) {
          optionElement.selected = true;
          const selectElement = optionElement.parentElement;
          selectElement.dispatchEvent(new Event('change'));
        } else {
          console.error('Elemen <option> tidak ditemukan.');
        }
      }, regional);
      await page.waitForTimeout(3000);

      await page.waitForSelector('#witel');
      await page.click('#witel');

      await page.evaluate((witel) => {
        const optionElement = document.querySelector(`#witel > option:nth-child(${witel})`);
        if (optionElement) {
          optionElement.selected = true;
          const selectElement = optionElement.parentElement;
          selectElement.dispatchEvent(new Event('change'));
        } else {
          console.error('Elemen <option> tidak ditemukan.');
        }
      }, witel);

      await tombol();
      const sugar_wsa = await page.evaluate(() => {
        const table = document.querySelector('#navs-teknis > table:nth-child(4)');
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows
          .map((row) => {
            const columns = Array.from(row.querySelectorAll('td, th'));
            return columns.map((column) => column.innerText).join(',');
          })
          .join('\n');
      });
      fs.writeFileSync(`loaded_file/wsa_gamas/${nama_file}.csv`, sugar_wsa);
      console.log(`${nama_file} berhasil didownload \n`);
    }

    await sugar_assurance(5, 1, 1, 'sugar_tif');
    await sugar_assurance(5, 2, 1, 'sugar_district_tif1');
    await sugar_assurance(5, 3, 1, 'sugar_district_tif2');
    await sugar_assurance(5, 4, 1, 'sugar_district_tif3');
    await sugar_assurance(5, 5, 1, 'sugar_district_tif4');
    await sugar_assurance(3, 1, 1, 'sugar_nas');
    await sugar_assurance(3, 2, 1, 'sugar_tr1');
    await sugar_assurance(3, 3, 1, 'sugar_tr2');
    await sugar_assurance(3, 4, 1, 'sugar_tr3');
    await sugar_assurance(3, 5, 1, 'sugar_tr4');
    await sugar_assurance(3, 6, 1, 'sugar_tr5');
    await sugar_assurance(3, 7, 1, 'sugar_tr6');
    await sugar_assurance(3, 8, 1, 'sugar_tr7');
    await sugar_assurance(2, 4, 1, 'sugar_area');
    await sugar_assurance(2, 4, 2, 'sugar_balnus');
    await sugar_assurance(2, 4, 3, 'sugar_jateng');
    await sugar_assurance(2, 4, 4, 'sugar_jatim');
  }

  await AsrGuarantee();

  async function tombol() {
    const [button] = await page.$x("//button[contains(., 'Filter')]");
    if (button) {
      await Promise.all([
        button.click(),
        page
          .waitForNavigation({
            waitUntil: 'networkidle0',
          })
          .catch((e) => void 0),
      ]);
    }
  }

  // jika ingin tutup browser:
  await browser.close();
})();
