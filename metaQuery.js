const mysql = require('mysql2/promise');
const fs = require('fs');
const { insertDate } = require('./currentDate.js');
const pool = require('./connection');

// Contoh pakai insertDate
console.log('Tanggal insert:', insertDate);

async function main() {
  // --- Query pertama ---
  const tgl = insertDate;
  const bulan = tgl.split('-')[1]; // "09"
  const bln = `m${bulan}`; // "${bln}"
  const month = parseInt(tgl.split('-')[1], 10); // 9

  console.log(bln);

  const sqltif = `
    SELECT 'ASR-ENT-Assurance Guarantee DATIN' AS kpi, sc_lokasi.witel AS lokasi, sugar_datin.jenis AS Area, sugar_datin.real AS Realisasi FROM sc_lokasi LEFT JOIN sugar_datin ON sc_lokasi.witel = sugar_datin.treg AND sugar_datin.tgl = '${tgl}' AND sugar_datin.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Assurance Guarantee WiFi' AS kpi, sc_lokasi.witel AS lokasi, sugar_wifi.jenis AS Area, sugar_wifi.comply AS Realisasi FROM sc_lokasi LEFT JOIN sugar_wifi ON sc_lokasi.witel = sugar_wifi.regional AND sugar_wifi.tgl = '${tgl}' AND sugar_wifi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Assurance Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, hsi_sugar.jenis AS Area, hsi_sugar.real AS Realisasi FROM sc_lokasi LEFT JOIN hsi_sugar ON sc_lokasi.witel = hsi_sugar.treg AND hsi_sugar.tgl = '${tgl}' AND hsi_sugar.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-TTI Compliance HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ttic AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-Fulfillment Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-PS to PI Ratio HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.pspi AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-TTR Fulfillment Guarantee 3 jam HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ttr_ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-WHF-TTI Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ttic AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-WHF-Fulfillment Guarantee Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-WHF-TTR Fulfillment Guarantee Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ttr_ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-TTR Compliance K1 DATIN 1,5 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-TTR Compliance K2 dan K1 Repair DATIN 3.6 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-TTR Compliance K3 DATIN 7.2 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k3 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-TTR Compliance WiFi' AS kpi, sc_lokasi.witel AS lokasi, ttr_wifi.jenis AS Area, ttr_wifi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttr_wifi ON sc_lokasi.witel = ttr_wifi.regional AND ttr_wifi.tgl = '${tgl}' AND ttr_wifi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-WHF-Assurance Guarantee' AS kpi, sc_lokasi.witel AS lokasi, wsa_sugar.lokasi AS Area, wsa_sugar.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_sugar ON sc_lokasi.witel = wsa_sugar.witel AND wsa_sugar.tgl = '${tgl}' AND wsa_sugar.lokasi IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-WHF-TTR Comply 3H (D,V)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr3.lokasi AS Area, wsa_ttr3.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr3 ON sc_lokasi.witel = wsa_ttr3.witel AND wsa_ttr3.tgl = '${tgl}' AND wsa_ttr3.lokasi IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-WHF-TTR Comply 6H (P)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr6.lokasi AS Area, wsa_ttr6.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr6 ON sc_lokasi.witel = wsa_ttr6.witel AND wsa_ttr6.tgl = '${tgl}' AND wsa_ttr6.lokasi IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-WHF-TTR Comply 36H (Non HVC)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr36.lokasi AS Area, wsa_ttr36.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr36 ON sc_lokasi.witel = wsa_ttr36.witel AND wsa_ttr36.tgl = '${tgl}' AND wsa_ttr36.lokasi IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-WHF-TTR Comply 3H Manja' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttrmanja.lokasi AS Area, wsa_ttrmanja.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttrmanja ON sc_lokasi.witel = wsa_ttrmanja.witel AND wsa_ttrmanja.tgl = '${tgl}' AND wsa_ttrmanja.lokasi IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Compliance-Time to Recover IndiBiz-4 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_indibiz.jenis AS Area, ttr_indibiz.real_1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_indibiz ON sc_lokasi.witel = ttr_indibiz.treg AND ttr_indibiz.tgl = '${tgl}' AND ttr_indibiz.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Compliance-Time to Recover IndiBiz-24 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_indibiz.jenis AS Area, ttr_indibiz.real_2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_indibiz ON sc_lokasi.witel = ttr_indibiz.treg AND ttr_indibiz.tgl = '${tgl}' AND ttr_indibiz.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Compliance-Time to Recover IndiHome Reseller-6 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_reseller.jenis AS Area, ttr_reseller.real_1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_reseller ON sc_lokasi.witel = ttr_reseller.treg AND ttr_reseller.tgl = '${tgl}' AND ttr_reseller.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-Compliance-Time to Recover IndiHome Reseller-36 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_reseller.jenis AS Area, ttr_reseller.real_2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_reseller ON sc_lokasi.witel = ttr_reseller.treg AND ttr_reseller.tgl = '${tgl}' AND ttr_reseller.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-MTTR DWDM' AS kpi, sc_lokasi.witel AS lokasi, ttr_dwdm.jenis AS Area, CASE WHEN ttr_dwdm.ach = 100 AND ttr_dwdm.real = 0 THEN '-' ELSE CAST(ttr_dwdm.real AS CHAR) END AS Realisasi FROM sc_lokasi LEFT JOIN ttr_dwdm ON sc_lokasi.witel = ttr_dwdm.treg AND ttr_dwdm.tgl = '${tgl}' AND ttr_dwdm.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ASR-ENT-MTTR SIP TRUNK' AS kpi, sc_lokasi.witel AS lokasi, ttr_siptrunk.jenis AS Area, CASE WHEN ttr_siptrunk.ach = 100 AND ttr_siptrunk.real = 0 THEN '-' ELSE CAST(ttr_siptrunk.real AS CHAR) END AS Realisasi FROM sc_lokasi LEFT JOIN ttr_siptrunk ON sc_lokasi.witel = ttr_siptrunk.treg AND ttr_siptrunk.tgl = '${tgl}' AND ttr_siptrunk.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ONM-ENT-WiFi Revitalization' AS kpi, sc_lokasi.witel AS lokasi, wifi_revi.jenis AS Area, wifi_revi.comply AS Realisasi FROM sc_lokasi LEFT JOIN wifi_revi ON sc_lokasi.witel = wifi_revi.regional AND wifi_revi.tgl = '${tgl}' AND wifi_revi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-Fulfillment Guarantee Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ffg_non_hsi.jenis AS Area, ffg_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ffg_non_hsi ON sc_lokasi.witel = ffg_non_hsi.regional AND ffg_non_hsi.tgl = '${tgl}' AND ffg_non_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-TTD Compliance Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ttd_non_hsi.jenis AS Area, ttd_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttd_non_hsi ON sc_lokasi.witel = ttd_non_hsi.regional AND ttd_non_hsi.tgl = '${tgl}' AND ttd_non_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'FFM-ENT-TTR Fulfillment Guarantee 3 Jam Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ttr_ffg_non_hsi.jenis AS Area, ttr_ffg_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttr_ffg_non_hsi ON sc_lokasi.witel = ttr_ffg_non_hsi.regional AND ttr_ffg_non_hsi.tgl = '${tgl}' AND ttr_ffg_non_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
    SELECT 'ONM-ALL-Service Availability-WiFi' AS kpi, sc_lokasi.witel AS lokasi, av_wifi_all.jenis AS Area, av_wifi_all.comply AS Realisasi FROM sc_lokasi LEFT JOIN av_wifi_all ON sc_lokasi.witel = av_wifi_all.regional AND av_wifi_all.tgl = '${tgl}' AND av_wifi_all.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
    UNION ALL
   SELECT 'FFM-ENT-Underspec Warranty Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.unspec AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('tif') WHERE sc_lokasi.reg IN ('tif', 'district')
  `;

  const sqldistrict = `
      SELECT 'ASR-ENT-Assurance Guarantee DATIN' AS kpi, sc_lokasi.witel AS lokasi, sugar_datin.jenis AS Area, sugar_datin.real AS Realisasi FROM sc_lokasi LEFT JOIN sugar_datin ON sc_lokasi.witel = sugar_datin.treg AND sugar_datin.tgl = '${tgl}' AND sugar_datin.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Assurance Guarantee WiFi' AS kpi, sc_lokasi.witel AS lokasi, sugar_wifi.jenis AS Area, sugar_wifi.comply AS Realisasi FROM sc_lokasi LEFT JOIN sugar_wifi ON sc_lokasi.witel = sugar_wifi.regional AND sugar_wifi.tgl = '${tgl}' AND sugar_wifi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Assurance Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, hsi_sugar.jenis AS Area, hsi_sugar.real AS Realisasi FROM sc_lokasi LEFT JOIN hsi_sugar ON sc_lokasi.witel = hsi_sugar.treg AND hsi_sugar.tgl = '${tgl}' AND hsi_sugar.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-TTI Compliance HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ttic AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-Fulfillment Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-PS to PI Ratio HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.pspi AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-TTR Fulfillment Guarantee 3 jam HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.ttr_ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-WHF-TTI Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ttic AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-WHF-Fulfillment Guarantee Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-WHF-TTR Fulfillment Guarantee Compliance' AS kpi, sc_lokasi.witel AS lokasi, ff_ih.jenis AS Area, ff_ih.ttr_ffg AS Realisasi FROM sc_lokasi LEFT JOIN ff_ih ON sc_lokasi.witel = ff_ih.lokasi AND ff_ih.tgl = '${tgl}' AND ff_ih.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-TTR Compliance K1 DATIN 1,5 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-TTR Compliance K2 dan K1 Repair DATIN 3.6 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL 
      SELECT 'ASR-ENT-TTR Compliance K3 DATIN 7.2 Jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_datin.jenis AS Area, ttr_datin.k3 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_datin ON sc_lokasi.witel = ttr_datin.treg AND ttr_datin.tgl = '${tgl}' AND ttr_datin.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-TTR Compliance WiFi' AS kpi, sc_lokasi.witel AS lokasi, ttr_wifi.jenis AS Area, ttr_wifi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttr_wifi ON sc_lokasi.witel = ttr_wifi.regional AND ttr_wifi.tgl = '${tgl}' AND ttr_wifi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-WHF-Assurance Guarantee' AS kpi, sc_lokasi.witel AS lokasi, wsa_sugar.lokasi AS Area, wsa_sugar.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_sugar ON sc_lokasi.witel = wsa_sugar.witel AND wsa_sugar.tgl = '${tgl}' AND wsa_sugar.lokasi IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-WHF-TTR Comply 3H (D,V)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr3.lokasi AS Area, wsa_ttr3.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr3 ON sc_lokasi.witel = wsa_ttr3.witel AND wsa_ttr3.tgl = '${tgl}' AND wsa_ttr3.lokasi IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-WHF-TTR Comply 6H (P)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr6.lokasi AS Area, wsa_ttr6.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr6 ON sc_lokasi.witel = wsa_ttr6.witel AND wsa_ttr6.tgl = '${tgl}' AND wsa_ttr6.lokasi IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-WHF-TTR Comply 36H (Non HVC)' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttr36.lokasi AS Area, wsa_ttr36.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttr36 ON sc_lokasi.witel = wsa_ttr36.witel AND wsa_ttr36.tgl = '${tgl}' AND wsa_ttr36.lokasi IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-WHF-TTR Comply 3H Manja' AS kpi, sc_lokasi.witel AS lokasi, wsa_ttrmanja.lokasi AS Area, wsa_ttrmanja.${bln} AS Realisasi FROM sc_lokasi LEFT JOIN wsa_ttrmanja ON sc_lokasi.witel = wsa_ttrmanja.witel AND wsa_ttrmanja.tgl = '${tgl}' AND wsa_ttrmanja.lokasi IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Compliance-Time to Recover IndiBiz-4 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_indibiz.jenis AS Area, ttr_indibiz.real_1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_indibiz ON sc_lokasi.witel = ttr_indibiz.treg AND ttr_indibiz.tgl = '${tgl}' AND ttr_indibiz.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Compliance-Time to Recover IndiBiz-24 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_indibiz.jenis AS Area, ttr_indibiz.real_2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_indibiz ON sc_lokasi.witel = ttr_indibiz.treg AND ttr_indibiz.tgl = '${tgl}' AND ttr_indibiz.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Compliance-Time to Recover IndiHome Reseller-6 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_reseller.jenis AS Area, ttr_reseller.real_1 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_reseller ON sc_lokasi.witel = ttr_reseller.treg AND ttr_reseller.tgl = '${tgl}' AND ttr_reseller.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-Compliance-Time to Recover IndiHome Reseller-36 jam' AS kpi, sc_lokasi.witel AS lokasi, ttr_reseller.jenis AS Area, ttr_reseller.real_2 AS Realisasi FROM sc_lokasi LEFT JOIN ttr_reseller ON sc_lokasi.witel = ttr_reseller.treg AND ttr_reseller.tgl = '${tgl}' AND ttr_reseller.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-MTTR DWDM' AS kpi, sc_lokasi.witel AS lokasi, ttr_dwdm.jenis AS Area, CASE WHEN ttr_dwdm.ach = 100 AND ttr_dwdm.real = 0 THEN '-' ELSE CAST(ttr_dwdm.real AS CHAR) END AS Realisasi FROM sc_lokasi LEFT JOIN ttr_dwdm ON sc_lokasi.witel = ttr_dwdm.treg AND ttr_dwdm.tgl = '${tgl}' AND ttr_dwdm.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ASR-ENT-MTTR SIP TRUNK' AS kpi, sc_lokasi.witel AS lokasi, ttr_siptrunk.jenis AS Area, CASE WHEN ttr_siptrunk.ach = 100 AND ttr_siptrunk.real = 0 THEN '-' ELSE CAST(ttr_siptrunk.real AS CHAR) END AS Realisasi FROM sc_lokasi LEFT JOIN ttr_siptrunk ON sc_lokasi.witel = ttr_siptrunk.treg AND ttr_siptrunk.tgl = '${tgl}' AND ttr_siptrunk.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ONM-ENT-WiFi Revitalization' AS kpi, sc_lokasi.witel AS lokasi, wifi_revi.jenis AS Area, wifi_revi.comply AS Realisasi FROM sc_lokasi LEFT JOIN wifi_revi ON sc_lokasi.witel = wifi_revi.regional AND wifi_revi.tgl = '${tgl}' AND wifi_revi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-Fulfillment Guarantee Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ffg_non_hsi.jenis AS Area, ffg_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ffg_non_hsi ON sc_lokasi.witel = ffg_non_hsi.regional AND ffg_non_hsi.tgl = '${tgl}' AND ffg_non_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-TTD Compliance Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ttd_non_hsi.jenis AS Area, ttd_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttd_non_hsi ON sc_lokasi.witel = ttd_non_hsi.regional AND ttd_non_hsi.tgl = '${tgl}' AND ttd_non_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'FFM-ENT-TTR Fulfillment Guarantee 3 Jam Non HSI' AS kpi, sc_lokasi.witel AS lokasi, ttr_ffg_non_hsi.jenis AS Area, ttr_ffg_non_hsi.comply AS Realisasi FROM sc_lokasi LEFT JOIN ttr_ffg_non_hsi ON sc_lokasi.witel = ttr_ffg_non_hsi.regional AND ttr_ffg_non_hsi.tgl = '${tgl}' AND ttr_ffg_non_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
      SELECT 'ONM-ALL-Service Availability-WiFi' AS kpi, sc_lokasi.witel AS lokasi, av_wifi_all.jenis AS Area, av_wifi_all.comply AS Realisasi FROM sc_lokasi LEFT JOIN av_wifi_all ON sc_lokasi.witel = av_wifi_all.regional AND av_wifi_all.tgl = '${tgl}' AND av_wifi_all.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
      UNION ALL
    SELECT 'FFM-ENT-Underspec Warranty Guarantee HSI' AS kpi, sc_lokasi.witel AS lokasi, ff_hsi.jenis AS Area, ff_hsi.unspec AS Realisasi FROM sc_lokasi LEFT JOIN ff_hsi ON sc_lokasi.witel = ff_hsi.lokasi AND ff_hsi.tgl = '${tgl}' AND ff_hsi.jenis IN ('reg') WHERE sc_lokasi.reg IN ('nas', 'witel')
  `;

  const [tif] = await pool.execute(sqltif);
  const [district] = await pool.execute(sqldistrict);

  function simpanCSV(dataRows, namaFile) {
    if (dataRows.length === 0) {
      console.log(`⚠️ Tidak ada data ditemukan untuk ${namaFile}`);
      return;
    }

    // Proses dan normalisasi setiap baris data
    dataRows = dataRows.map((row) => {
      let newRow;
      const lokasi_dis = ['D_BALI', 'D_MALANG', 'D_NUSRA', 'D_SEMARANG', 'D_SIDOARJO', 'D_SOLO', 'D_SURAMADU', 'D_YOGYAKARTA'];

      if (namaFile === 'tif.csv') {
        if (row.lokasi === 'NUSA TENGGARA') {
          newRow = { ...row, lokasi: 'D_NUSRA' };
        } else if (row.lokasi?.includes('TERRITORY')) {
          newRow = { ...row, lokasi: row.lokasi.replace('TERRITORY', 'TIF') };
        } else {
          newRow = { ...row, lokasi: `D_${row.lokasi}` };
        }

        if (lokasi_dis.includes(newRow.lokasi)) {
          newRow = { ...newRow, Area: 'dis' };
        }
      } else {
        const region4 = ['KUDUS', 'MAGELANG', 'PEKALONGAN', 'PURWOKERTO', 'SEMARANG', 'SOLO', 'YOGYAKARTA'];
        const nasional = ['REGIONAL 01', 'REGIONAL 02', 'REGIONAL 03', 'REGIONAL 04', 'REGIONAL 05', 'REGIONAL 06', 'REGIONAL 07'];

        newRow = {
          ...row,
          Area: region4.includes(row.lokasi) ? 'reg4' : nasional.includes(row.lokasi) ? 'reg' : 'reg5',
        };
      }

      // Pastikan Realisasi selalu ada (isi angka atau strip)
      if (row.Realisasi === null || row.Realisasi === undefined || row.Realisasi === '') {
        newRow.Realisasi = '-';
      }

      // Susun ulang kolom dan tambahkan insert_at
      return {
        kpi: newRow.kpi ?? '',
        lokasi: newRow.Area ?? '',
        Area: newRow.lokasi ?? '',
        Realisasi: newRow.Realisasi ?? '-',
        insert_at: insertDate,
        bulan: month,
      };
    });

    // Buat header CSV
    const headers = Object.keys(dataRows[0])
      .map((h) => `"${h.replace(/"/g, '""')}"`)
      .join(',');

    // Buat isi CSV
    const data = dataRows
      .map((row) =>
        Object.entries(row)
          .map(([key, val]) => {
            if (key === 'Realisasi') {
              if (val === '-' || val == null || val === '') {
                return '"-"';
              }
              const num = parseFloat(val);
              return isNaN(num) ? '"-"' : num.toFixed(2);
            }

            if (key === 'bulan') {
              return month; // angka langsung
            }

            const safeVal = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
            return `"${safeVal}"`;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${data}`;

    // Simpan file CSV
    const dir = 'loaded_file/msa_upload';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/${namaFile}`, csv, 'utf-8');
    console.log(`✅ File ${namaFile} berhasil dibuat.`);
  }

  // Contoh pemakaian
  simpanCSV(tif, 'tif.csv');
  simpanCSV(district, 'district.csv');
  // gabungCSV('tif.csv', 'district.csv', 'loaded_file/msa_upload/msa_upload.csv');
  await pool.end();
}

main().catch(console.error);
