const moment = require('moment-timezone');

function serverTime() {
  return moment().tz('Europe/Kiev').format();
}

module.exports = {
  serverTime: serverTime
};
