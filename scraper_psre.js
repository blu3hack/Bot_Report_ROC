const axios = require('axios');
const { parse } = require('csv-parse');
const fs = require('fs');

const sheetUrl = 'https://docs.google.com/spreadsheets/d/1KlkfXYhf06AFRgJS_wXuQ1UquWhzYBBgfXGxODI3mpI/export?format=csv&gid=1816473736';

async function fetchSelectedRangeAndSave() {
  try {
    const response = await axios.get(sheetUrl);
    const csvContent = response.data;

    async function getDataFromSheet(indexRowsUp, indexRowsDown, nameFile) {
      parse(csvContent, {}, (err, rows) => {
        if (err) throw err;
        // Ambil baris ke-4 sampai ke-35 (index 3 sampai 34)
        const selectedRows = rows.slice(indexRowsUp, indexRowsDown);
        // Ambil kolom D sampai K (index 3 sampai 10)
        const selectedData = selectedRows.map((row) =>
          row.slice(3, 10).map(
            (cell) => cell.replace(/[,|%]/g, '') // Hapus koma dan persen dari setiap sel
          )
        );
        // Ubah ke format CSV string
        const csvOutput = selectedData.map((row) => row.join(',')).join('\n');
        // Simpan ke file baru
        fs.writeFileSync(`loaded_file/wsa/${nameFile}`, csvOutput);
        console.log(`${nameFile} Saved Successfully`);
      });
    }
    getDataFromSheet(3, 23, 'psre_witel.csv');
    getDataFromSheet(27, 35, 'psre_tif.csv');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
fetchSelectedRangeAndSave();
