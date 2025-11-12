const puppeteer = require('puppeteer');
const { user_care, pass_care } = require('./login');
const fs = require('fs');
const { exec } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://simarvel.telkom.co.id/dashboard');

    console.log('Berhasil login ke TelkomCare');
  } catch (err) {
    console.error('Ada kesalahan:', err.message);
  } finally {
    // await browser.close();
  }
})();
