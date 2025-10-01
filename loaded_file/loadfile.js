// loadfile.js
const { spawn } = require('child_process');

function runCommand(cmd, args = [], label = '', delay = 0) {
  return new Promise((resolve) => {
    if (label) console.log(label);

    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      console.log(`✅ Proses ${[cmd, ...args].join(' ')} selesai (exit code: ${code})`);
      if (delay > 0) {
        console.log(`⏳ Menunggu ${delay / 1000} detik...`);
        setTimeout(resolve, delay);
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log('Melakukan Proses Loaded filedata ke dalam Database');
  await new Promise((r) => setTimeout(r, 5000)); // delay 5 detik

  await runCommand('node', ['wsa_gamas'], '\n========== Proses Loaded file WSA GAMAS ===========', 5000);
  await runCommand('node', ['wsa_assurance'], '\n========== Proses Loaded file WSA ASSURANCE ===========', 5000);

  await runCommand('node', ['fulfillment'], '\n========= Proses Loaded file FULFILLMENT =========', 0);
  await runCommand('node', ['insert_ff_ih'], '', 5000);
  await runCommand('node', ['insert_ff_hsi'], '', 5000);

  await runCommand('node', ['asr_wifi'], '\n========= Proses Loaded file ASSURANCE WIFI =========', 5000);
  await runCommand('node', ['asr_datin'], '\n========= Proses Loaded file ASSURANCE DATIN =========', 5000);
  await runCommand('node', ['assurance'], '\n========= Proses Loaded file TTR DATIN =========', 5000);
  await runCommand('node', ['wifi_revi'], '\n========= Proses Loaded file WIFI REVITASISASI =========', 5000);
  await runCommand('node', ['av_wifi'], '\n========= Proses Loaded file Availability WIFI =========', 5000);
  await runCommand('node', ['ttr_ffg_non_hsi'], '\n========= Proses Loaded file FFG NON HSI =========', 5000);
  await runCommand('node', ['ps_re'], '\n========= Proses Loaded file PSRE =========', 5000);
  await runCommand('node', ['cnop_critical'], '\n========= Proses Loaded CNOP_LATENCY =========', 5000);

  console.log('\nEksekusi selesai. Tunggu sebentar sebelum menutup...');
  await new Promise((r) => setTimeout(r, 3000)); // delay 3 detik
}

main();
