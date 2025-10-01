const puppeteer = require('puppeteer');
// const connection = require('./connection');
const { user, pass } = require('./login');
const fs = require('fs');
const { periode_long_format, enddate_long_format } = require('./currentDate');
const { exec } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://newxpro.telkom.co.id/ebis');
    await page.waitForSelector('#username');
    await page.type('#username', user);
    await page.type('#password', pass);

    console.log('Masukkan Captcha secara Manual dan tunggu sebentar');
    await page.waitForTimeout(10000);
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('form button[type="submit"]')]);
    console.log('Masukkan OTP secara Manual dan tunggu sebentar');
    await page.waitForTimeout(10000);
    console.log('Berhasil login ke NewXPro');

    // Ambil data ttr ffg

    async function ttdc_non_hsi(territory, regional, fileName) {
      await page.waitForTimeout(3000);
      console.log('Mengambil data TTR FFG');
      await page.goto('https://newxpro.telkom.co.id/ebis/msa/ttdc-2025', { waitUntil: 'networkidle0' });
      // selector
      const inputs = await page.$$('input[data-te-select-input-ref]');
      await inputs[0].click(); // index mulai dari 0 → ini klik elemen ke-2
      const [span_territory] = await page.$x(`//span[contains(., '${territory}')]`);

      if (span_territory) {
        await span_territory.click();
      } else {
        console.log(`Elemen span dengan teks ${territory} tidak ditemukan.`);
      }

      await inputs[1].click(); // index mulai dari 0 → ini klik elemen ke-2
      const [span_regional] = await page.$x(`//span[contains(., '${regional}')]`);

      if (span_regional) {
        await span_regional.click();
      } else {
        console.log(`Elemen span dengan teks ${regional} tidak ditemukan.`);
      }

      // pilih tanggal
      const result = periode_long_format;
      console.log(result);

      async function selectdate(selectorDate) {
        const inputSelector = selectorDate; // Ganti dengan selector elemen input Anda
        await page.waitForSelector(inputSelector);

        await page.evaluate(
          (selector, value) => {
            const input = document.querySelector(selector);
            if (input) {
              input.value = value; // Ubah nilai
              input.dispatchEvent(new Event('input', { bubbles: true })); // Trigger event input
              input.dispatchEvent(new Event('change', { bubbles: true })); // Trigger event change
            } else {
              console.error(`Elemen dengan selector ${selector} tidak ditemukan.`);
            }
          },
          inputSelector,
          result
        );
      }

      await selectdate('#provcomp_date');
      await selectdate('#order_date');

      await page.waitForTimeout(3000);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('#filter_data > div > div:nth-child(8) > div > div > a')]);

      // ambil data dari table
      await page.waitForSelector('#LoadingImage', { hidden: true });
      const ttd_non_hsi = await page.evaluate(() => {
        const tbody = document.querySelector('#orderNONJT > div.flex.flex-col > div > div > table');
        if (!tbody) return 'tbody #table2 tidak ditemukan';

        const rows = Array.from(tbody.querySelectorAll('tr'));
        return rows
          .map((row) => {
            const columns = Array.from(row.querySelectorAll('td, th'));
            return columns.map((c) => c.textContent.trim()).join(',');
          })
          .filter((line) => line.trim() !== '') // buang baris kosong
          .join('\n');
      });

      console.log(ttd_non_hsi);
      fs.writeFileSync(`loaded_file/ff_non_hsi/${fileName}.csv`, ttd_non_hsi);
      console.log(`${fileName} berhasil didownload \n`);
    }

    await ttdc_non_hsi('NEW TREG', 'ALL', 'ttdc_tif');
    await ttdc_non_hsi('NEW TREG', 'REGIONAL 3', 'ttdc_district');
    await ttdc_non_hsi('OLD TREG', 'ALL', 'ttdc_reg');
    await ttdc_non_hsi('OLD TREG', 'REGIONAL 4', 'ttdc_reg4');
    await ttdc_non_hsi('OLD TREG', 'REGIONAL 5', 'ttdc_reg5');

    async function ffg_non_hsi(territory, regional, fileName) {
      await page.waitForTimeout(3000);
      console.log('Mengambil data FFG');
      await page.goto('https://newxpro.telkom.co.id/ebis/msa/ffg-datin', {
        waitUntil: 'domcontentloaded',
        timeout: 120000, // 2 menit
      });

      // selector
      const inputs = await page.$$('input[data-te-select-input-ref]');
      await inputs[0].click(); // index mulai dari 0 → ini klik elemen ke-2
      const [span_territory] = await page.$x(`//span[contains(., '${territory}')]`);

      if (span_territory) {
        await span_territory.click();
      } else {
        console.log(`Elemen span dengan teks ${territory} tidak ditemukan.`);
      }

      await inputs[1].click(); // index mulai dari 0 → ini klik elemen ke-2
      const [span_regional] = await page.$x(`//span[contains(., '${regional}')]`);

      if (span_regional) {
        await span_regional.click();
      } else {
        console.log(`Elemen span dengan teks ${regional} tidak ditemukan.`);
      }

      const result = enddate_long_format;
      console.log(result);

      async function selectdate(selectorDate) {
        const inputSelector = selectorDate; // Ganti dengan selector elemen input Anda
        await page.waitForSelector(inputSelector);

        await page.evaluate(
          (selector, value) => {
            const input = document.querySelector(selector);
            if (input) {
              input.value = value; // Ubah nilai
              input.dispatchEvent(new Event('input', { bubbles: true })); // Trigger event input
              input.dispatchEvent(new Event('change', { bubbles: true })); // Trigger event change
            } else {
              console.error(`Elemen dengan selector ${selector} tidak ditemukan.`);
            }
          },
          inputSelector,
          result
        );
      }

      await selectdate('#orderdate');

      await page.waitForTimeout(3000);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }), page.click('#filter_data > div > div:nth-child(6) > div > div > a')]);

      // ambil data dari table
      // tunggu sampai ada isi data (selain header)
      async function getDataTable(table, fileData) {
        // tunggu sampai tabel benar-benar terisi
        await page.waitForFunction(
          (selector) => {
            const tbody = document.querySelector(selector);
            if (!tbody) return false;

            const rows = tbody.querySelectorAll('tr');
            if (rows.length < 2) return false; // header + minimal 1 data

            return Array.from(rows).some((r) => Array.from(r.querySelectorAll('td')).some((td) => td.textContent.trim() !== ''));
          },
          { timeout: 0 },
          table // lempar variabel ke dalam fungsi di atas
        );

        // ambil data tabel
        const ttd_non_hsi = await page.evaluate((selector) => {
          const tbody = document.querySelector(selector);
          if (!tbody) return `tbody ${selector} tidak ditemukan`;

          const rows = Array.from(tbody.querySelectorAll('tr'));
          return rows
            .map((row) => {
              const columns = Array.from(row.querySelectorAll('td, th'));
              return columns.map((c) => c.textContent.trim()).join(',');
            })
            .filter((line) => line.trim() !== '')
            .join('\n');
        }, table);

        const header = 'witel,avg,jml,real';
        const csvContent = `${header}\n${ttd_non_hsi}`;

        console.log(csvContent);
        fs.writeFileSync(`loaded_file/ff_non_hsi/${fileData}.csv`, csvContent);
        console.log(`${fileData} berhasil didownload \n`);
      }

      await getDataTable('table #table1', `ffg_${fileName}`);
      await getDataTable('table #table2', `ttr_ffg_${fileName}`);
    }

    await ffg_non_hsi('NEW TREG', 'ALL', 'tif');
    await ffg_non_hsi('NEW TREG', 'REGIONAL 3', 'district');
    await ffg_non_hsi('OLD TREG', 'ALL', 'reg');
    await ffg_non_hsi('OLD TREG', 'REGIONAL 4', 'reg4');
    await ffg_non_hsi('OLD TREG', 'REGIONAL 5', 'reg5');
  } catch (err) {
    console.error('Ada kesalahan:', err.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
