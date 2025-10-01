const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const downloadPath = path.resolve(__dirname, 'loaded_file/cnop');
const finalFileName = 'cnop_critical.csv'; // tanpa ekstensi

// Buat folder jika belum ada
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
  console.log('Folder "loaded_file/cnop" berhasil dibuat.');
}

// Fungsi bantu: tunggu file terdownload dan rename
async function waitAndRenameFile(expectedExtension = '.xlsx') {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const files = fs.readdirSync(downloadPath);
      const downloaded = files.find((f) => f.endsWith(expectedExtension) && !f.endsWith('.crdownload'));

      if (downloaded) {
        const oldPath = path.join(downloadPath, downloaded);
        const newPath = path.join(downloadPath, finalFileName); // tanpa ekstensi

        fs.renameSync(oldPath, newPath);
        clearInterval(interval);
        console.log(`File berhasil diubah namanya menjadi: ${finalFileName}`);
        resolve();
      }
    }, 1000);
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1280,800'],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.goto('https://telkominfraco-my.sharepoint.com/:x:/g/personal/chandra_akbar_tif_co_id/EVgXvpIkOjxKn3pzkeSIBi4BL0sjO1ltwKs3ozvvy1rvJQ?e=Cg0l4n', {
    waitUntil: 'networkidle2',
  });

  console.log('Silakan tekan tombol download secara manual.');

  await waitAndRenameFile('.xlsx');
  await browser.close();
})();
