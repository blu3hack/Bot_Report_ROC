@echo off
echo Melakukan Proses Scrapper dan Download data dari Dashboard WSA ASSURANCE
timeout /t 5 /nobreak >nul

echo:
echo ========== Proses Login Dashboard, masukkan OTP secara manual ===========
node wsa_gamas.js
echo Proses Scrapping Data Gamas dari WSA ASSURANCE selesai

timeout /t 5 /nobreak >nul

