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
