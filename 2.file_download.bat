@echo off
echo Melakukan Proses Scrapper dan Download data dari Dashboard WSA ASSURANCE
timeout /t 5 /nobreak >nul

echo:
echo ========== Proses Login Dashboard, masukkan OTP secara manual ===========
node file_download.js
echo Proses Scrapping dan DOwnload data dari WSA ASSURANCE selesai

timeout /t 10 /nobreak >nul

echo:
echo ========== Extract dan Insert data Hasil Download ke Database ===========
node ExtractAndInsertFile.js
timeout /t 5 /nobreak >nul
node extract.js
timeout /t 5 /nobreak >nul
node insertLoadFile.js
echo:
echo ========== Extract dan Insert data Selesai ===========
timeout /t 5 /nobreak >nul
echo ========== Proses Delete Data dan OTP ===========
node deleteFileDownload
timeout /t 5 /nobreak >nul
echo Proses Scrapping dan DOwnload data dari WSA ASSURANCE selesai
echo:
timeout /t 5 /nobreak >nul

