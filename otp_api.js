const { exec } = require('child_process');

exec('python otp.py', (error, stdout, stderr) => {
  if (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`OTP dari Python: ${stdout.trim()}`);
});
