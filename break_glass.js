// index.js
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const { spawn } = require('child_process');
const pool = require('./connection');
const { token } = require('./login');

const bot = new TelegramBot(token, { polling: true });

// Test koneksi database
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Gagal terkoneksi ke database:', err.message);
    return;
  }
  console.log('✅ Terkoneksi ke database MySQL.');
  conn.release();
});

// === SIMPAN PROSES YANG BERJALAN ===
const runningProcesses = {}; // key: command, value: child process

// === DAFTAR COMMAND YANG DIPERBOLEHKAN ===
const availableCommands = [
  'ps_re',
  'wsa_gamas',
  'file_download',
  'extractandinsertfile',
  'ectract',
  'insertloadfile',
  'deletefiledownload',
  'wifi_revi',
  'asr_wifi.js',
  'fulfillment',
  'telkomcare',
  'scrapper_psre',
  'scrapper_cnop',
  'ttr_ffg_non_hsi',
  'cd loaded_file',
  'cd ..',
  'dir',
  'test',
  'loadfile',
  'delete',
];

// === HANDLE PESAN TELEGRAM ===
bot.on('message', (msg) => {
  const { message_id, chat, from, text } = msg;
  const chatId = chat.id;
  const username = from.username || from.first_name || 'Unknown';
  const command = text.trim();

  if (username !== 'nheq_12') {
    return bot.sendMessage(chatId, '❌ Tidak diizinkan menggunakan bot ini.');
  }

  // --- Hapus semua data lama (seperti kode asli) ---
  pool.query('DELETE FROM get_otp_for_download', (err) => {
    if (err) console.error('❌ Gagal delete data awal:', err.message);
  });

  // --- Fungsi simpan pesan ke DB ---
  function saveMessageToDB(cmd) {
    const now = new Date();
    const values = [username, cmd, now.toISOString().slice(0, 19).replace('T', ' ')];
    pool.query(`INSERT INTO get_otp_for_download (username, pesan, otp_for) VALUES (?, ?, ?)`, values, (err) => {
      if (err) console.error('❌ Gagal menyimpan pesan:', err.message);
      else console.log(`💾 Pesan ${message_id} berhasil disimpan.`);
    });
  }

  // --- STOP command (kill child) ---
  if (command.startsWith('stop ')) {
    const toStop = command.split(' ')[1];
    if (runningProcesses[toStop]) {
      runningProcesses[toStop].kill('SIGTERM');
      delete runningProcesses[toStop];
      return bot.sendMessage(chatId, `🛑 Proses ${toStop} dihentikan.`);
    } else {
      return bot.sendMessage(chatId, `⚠️ Tidak ada proses bernama ${toStop} yang berjalan.`);
    }
  }

  // --- LIST command (lihat proses aktif) ---
  if (command === 'list') {
    const active = Object.keys(runningProcesses);
    return bot.sendMessage(chatId, active.length ? `🔎 Proses aktif:\n${active.join('\n')}` : '✅ Tidak ada proses aktif.');
  }

  // --- Jalankan command ---
  if (availableCommands.includes(command) || command.startsWith('cpt')) {
    saveMessageToDB(command);

    if (runningProcesses[command]) {
      return bot.sendMessage(chatId, `⚠️ Proses ${command} sudah berjalan.`);
    }

    // path file .js
    const fs = require('fs');
    const path = require('path');

    if (command.startsWith('cd ')) {
      // --- pindah direktori ---
      const targetDir = command.split(' ')[1];

      try {
        process.chdir(targetDir);
        bot.sendMessage(chatId, `📂 Direktori berpindah ke: ${process.cwd()}`);
      } catch (err) {
        bot.sendMessage(chatId, `❌ Gagal pindah direktori: ${err.message}`);
      }
    } else if (command === 'dir') {
      // --- tampilkan isi direktori ---
      try {
        const files = fs.readdirSync(process.cwd(), { withFileTypes: true });
        let list = files.map((f) => (f.isDirectory() ? `📁 ${f.name}` : `📄 ${f.name}`)).join('\n');

        if (!list) list = '(kosong)';
        bot.sendMessage(chatId, `📂 Isi direktori ${process.cwd()}:\n\n${list}`);
      } catch (err) {
        bot.sendMessage(chatId, `❌ Gagal membaca direktori: ${err.message}`);
      }
    } else {
      // --- jalankan file .js ---
      const scriptPath = path.join(process.cwd(), `${command}.js`);

      if (!fs.existsSync(scriptPath)) {
        return bot.sendMessage(chatId, `❌ Script ${command}.js tidak ditemukan`);
      }

      if (command === 'delete.bat' || command === 'loadfile.bat') {
        const child = spawn(command, {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      }

      const child = spawn('node', [scriptPath], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      runningProcesses[command] = child;

      bot.sendMessage(chatId, `▶️ Menjalankan ${command}.js ...`);

      child.stdout.on('data', (data) => {
        bot.sendMessage(chatId, data.toString());
      });

      child.stderr.on('data', (data) => {
        bot.sendMessage(chatId, '⚠️ Error: ' + data.toString());
      });

      child.on('close', (code) => {
        delete runningProcesses[command];
        bot.sendMessage(chatId, `✅ Proses ${command} selesai (exit code: ${code})`);
      });
    }

    bot.sendMessage(chatId, `▶️ Menjalankan ${command}.js ...`);

    // khusus command tertentu, kirim captcha otomatis
    if (['fulfillment', 'telkomcare', 'scrapper_psre', 'ttr_ffg_non_hsi', 'ps_re'].includes(command)) {
      setTimeout(() => {
        bot.sendPhoto(chatId, 'captcha/cpt.png', {
          caption: '✅ captcha',
        });
      }, 10000);
    }
  } else {
    bot.sendMessage(chatId, `❌ Forbidden Command\n<=Available commands=>:\n${availableCommands.join('\n ')}`);
  }
});
