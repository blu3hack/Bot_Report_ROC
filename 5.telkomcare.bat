@echo off
echo Melakukan Proses Scrapper Untuk Data Sumber dari Telkomcare
timeout /t 5 /nobreak >nul

node telkomcare.js
echo Proses Scrapping data Telkomcare selesai
timeout /t 5 /nobreak >nul

