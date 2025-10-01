@echo off
echo Melakukan Proses Scrapper Untuk Data Fufillment
timeout /t 5 /nobreak >nul

node fulfillment.js
echo Proses Scrapping data Fulfillment Selesai
timeout /t 5 /nobreak >nul

