// const periode_long_format = `2025-07-01 to 2025-07-15`;
// const periode_short_format = `202507`;

// const startdate_short_format = `20250701`;
// const enddate_short_format = `20250715`;

// const startdate_long_format = `2025-07-01`;
// const enddate_long_format = `2025-07-15`;

// const insertDate = '2025-07-15';

// module.exports = {
//   periode_long_format: periode_long_format,
//   periode_short_format: periode_short_format,
//   startdate_short_format: startdate_short_format,
//   startdate_long_format: startdate_long_format,
//   enddate_short_format: enddate_short_format,
//   enddate_long_format: enddate_long_format,
//   insertDate: insertDate,
// };

// ===========================================

const currentDate = new Date(); // objek Date
const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

const yyyy = startOfMonth.getFullYear();
const mm = String(startOfMonth.getMonth() + 1).padStart(2, '0');
const dd = String(startOfMonth.getDate()).padStart(2, '0');

// ======
const startdate = `${yyyy}-${mm}-${dd}`;
const today = currentDate.toISOString().split('T')[0];
const periode_long_format = `${startdate} to ${today}`;
// ======
const periode_short_format = `${yyyy}${mm}`;
//  =====
const startdate_short_format = `${yyyy}${mm}${dd}`;

const today_short_format = today.replace(/-/g, '');

const startdate_long_format = startdate;
const enddate_short_format = today_short_format;
const enddate_long_format = today;
const insertDate = today;

const year = currentDate.getFullYear();
const month = currentDate.getMonth(); // 0 = Jan, 11 = Des

// Dapatkan tanggal terakhir bulan ini
const lastDayOfMonth = new Date(year, month + 1, 0);
const lastDate = lastDayOfMonth.toISOString().split('T')[0];

// console.log('Hari ini :', today);
// console.log('Tanggal terakhir bulan ini :', lastDate);

// console.log(insertDate);

module.exports = {
  periode_long_format: periode_long_format,
  periode_short_format: periode_short_format,
  startdate_short_format: startdate_short_format,
  enddate_short_format: enddate_short_format,
  startdate_long_format: startdate_long_format,
  enddate_long_format: enddate_long_format,
  insertDate: insertDate,
  MaxDate: lastDate,
};
