const moment = require('moment-timezone');

function prettyPrintTimeStamp(unix_timestamp) {
  return moment.tz(parseInt(unix_timestamp) * 1000, 'Europe/Kiev').format();
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = {
  prettyPrintTimeStamp: prettyPrintTimeStamp,
  isNumber: isNumber
};
