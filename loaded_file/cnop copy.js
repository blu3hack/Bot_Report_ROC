const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const connection = require('./connection');
const util = require('util');
const { insertDate } = require('../currentDate');

// Konversi koneksi mysql ke async
const query = util.promisify(connection.query).bind(connection);

// Simpan Excel
function exportCsvFile(file_name, exportFileName) {
  const csvFile = fs.readFileSync(`./cnop/${file_name}.csv`, 'utf-8');
  const workbook = XLSX.read(csvFile, { type: 'string' });
  XLSX.writeFile(workbook, `./cnop/${exportFileName}.xlsx`);
  console.log(`✅ File ${exportFileName}.xlsx berhasil dibuat`);
}

// Ambil range cell dari sheet
function ambilRange(sheet, kolom, dari, sampai) {
  const hasil = [];
  for (let i = dari; i <= sampai; i++) {
    const sel = sheet[`${kolom}${i}`];
    hasil.push(sel ? sel.v : null);
  }
  return hasil;
}

// Ambil data dari Excel lalu simpan ke CSV
async function getDataLatency(file, area, colArea, rowAreaStart, rowAreaEnd, colReal, rowRealStart, rowRealEnd) {
  const workbook = XLSX.readFile(`./cnop/${file}.xlsx`);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const dataArea = ambilRange(sheet, colArea, rowAreaStart, rowAreaEnd);
  const dataRealisasi = ambilRange(sheet, colReal, rowRealStart, rowRealEnd);

  const dataGabung = dataArea.map((lokasi, i) => ({
    kolom_O: lokasi,
    kolom_T: dataRealisasi[i],
  }));

  const csvWriter = createCsvWriter({
    path: `./cnop/${file}_${area}.csv`,
    header: [
      { id: 'kolom_O', title: 'Kolom O' },
      { id: 'kolom_T', title: 'Kolom T' },
    ],
  });

  await csvWriter.writeRecords(dataGabung);
  console.log(`✅ ${file}_${area}.csv disimpan`);
}

// Hapus data sebelumnya
async function deleteExistingData() {
  const tableForDelete = ['cnop_latency', 'cnop_critical'];
  const today = insertDate;
  for (const table of tableForDelete) {
    await query(`DELETE FROM ${table} WHERE insert_at = ?`, [today]);
    console.log(`🗑 Data dari ${table} untuk ${today} dihapus`);
  }
}

// Hapus baris yang tidak diinginkan
async function deleteUnwantedRows(table) {
  const values = ['TOTAL', '', 'Territory', 'EX TREG', 'SUB-DISTRICT', 'GRAND TOTAL', 'DISTRICT'];
  for (const area of values) {
    await query(`DELETE FROM ${table} WHERE area = ?`, [area]);
  }
}

// Masukkan CSV ke database
async function inputDataToDatabase(file, kpi, lokasi, tableName) {
  const filePath = path.join(__dirname, 'cnop', `${file}.csv`);
  const today = insertDate;

  const records = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        let area = data[Object.keys(data)[0]] || '';
        area = area.replace('TIF-', 'TERRITORY 0');
        area = area.replace('REG-', 'REGIONAL 0');
        area = area.replace('NUSRA', 'NUSA TENGGARA');

        const raw = parseFloat(data[Object.keys(data)[1]]) || 0;
        const realisasi = parseFloat((raw * 100).toFixed(2));

        records.push([kpi, lokasi, area, realisasi, today]);
      })
      .on('end', async () => {
        const insertQuery = `INSERT INTO ${tableName} (kpi, lokasi, area, realisasi, insert_at) VALUES ?`;
        await query(insertQuery, [records]);
        await deleteUnwantedRows(tableName);
        console.log(`📥 ${file}.csv berhasil diinput ke ${tableName}`);
        resolve();
      })
      .on('error', reject);
  });
}

// Main function (run step-by-step)
async function main() {
  await deleteExistingData();

  exportCsvFile('PI Laten - TIF3 MSO 2025(LATENCY Agustus)', 'latency');
  exportCsvFile('PI Laten - TIF3 MSO 2025(MTTRi Critical Agustus)', 'critical');

  // // LATENCY
  await getDataLatency('latency', 'tif', 'O', 5, 15, 'T', 5, 15);
  await getDataLatency('latency', 'reg', 'P', 5, 15, 'T', 5, 15);
  await getDataLatency('latency', 'district', 'W', 5, 14, 'AB', 5, 14);
  await getDataLatency('latency', 'witel', 'AG', 5, 26, 'AL', 5, 26);

  // // CRITICAL
  await getDataLatency('critical', 'tif', 'A', 3, 16, 'G', 3, 16);
  await getDataLatency('critical', 'reg', 'B', 6, 16, 'G', 6, 16);
  await getDataLatency('critical', 'district', 'J', 6, 14, 'O', 6, 14);
  await getDataLatency('critical', 'witel', 'S', 6, 26, 'X', 6, 26);

  // LATENCY to DB
  await inputDataToDatabase('latency_tif', 'ONM-WHM-Latency RAN to Core', 'tif', 'cnop_latency');
  await inputDataToDatabase('latency_reg', 'ONM-WHM-Latency RAN to Core', 'reg', 'cnop_latency');
  await inputDataToDatabase('latency_district', 'ONM-WHM-Latency RAN to Core', 'tif', 'cnop_latency');
  await inputDataToDatabase('latency_witel', 'ONM-WHM-Latency RAN to Core', 'reg', 'cnop_latency');

  // CRITICAL to DB
  await inputDataToDatabase('critical_tif', 'ASR-WHM-MTTRi Critical Compliance', 'tif', 'cnop_critical');
  await inputDataToDatabase('critical_reg', 'ASR-WHM-MTTRi Critical Compliance', 'reg', 'cnop_critical');
  await inputDataToDatabase('critical_district', 'ASR-WHM-MTTRi Critical Compliance', 'tif', 'cnop_critical');
  await inputDataToDatabase('critical_witel', 'ASR-WHM-MTTRi Critical Compliance', 'reg', 'cnop_critical');

  console.log('✅ Semua proses selesai. Tekan CTRL+C untuk keluar.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan:', err);
  process.exit(1);
});
