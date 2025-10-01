@echo off
echo Melakukan Proses Loaded filedata ke dalam Database
timeout /t 5 /nobreak >nul

echo:
echo ========== Proses Loaded file WSA GAMAS ===========
node wsa_gamas
echo Proses Loaded file WSA GAMAS Selesai

echo:
echo ========== Proses Loaded file WSA ASSURANCE ===========
node wsa_assurance
echo Proses Loaded file WSA ASSURANCE Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file FULFILLMENT =========
node fulfillment
node insert_ff_ih
node insert_ff_hsi
echo Proses Loaded file FULFILLMENT Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file ASSURANCE WIFI ========= 
node asr_wifi
echo Proses Loaded file ASSURANCE WIFI Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file ASSURANCE DATIN ========= 
node asr_datin
echo Proses Loaded file ASSURANCE DATIN Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file TTR DATIN ========= 
node assurance
echo Proses Loaded file TTR DATIN Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file WIFI REVITASISASI ========= 
node wifi_revi
echo Proses Loaded file WIFI REVITASISASI Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file Availability WIFI ========= 
node av_wifi
echo Proses Loaded file Availability WIFI Selesai

echo:
timeout /t 5 /nobreak >nul

echo ========= Proses Loaded file FFG NON HSI ========= 
node ttr_ffg_non_hsi
echo Proses Loaded file FFG NON HSI Selesai

echo ========= Proses Loaded filePSRE ========= 
node ps_re
echo Proses Loaded filePSRE Selesai

echo ========= Proses Loaded CNOP_LATENCY ========= 
node cnop_critical
echo Proses Loaded filePSRE Selesai

echo:
echo Eksekusi selesai. Tunggu sebentar sebelum menutup...
timeout /t 3 /nobreak >nul
