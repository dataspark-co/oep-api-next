const redis = require('redis');
const moment = require('moment-timezone');

const CONFIG = require('../config.json');

let _callbackHash = function () {};
let client = null;

function cleanExit(client, callback, responseArr) {
  client.end(true);
  client.quit();

  // process.exit(1);
  callback(responseArr);
}

function setupClient() {
  client = redis.createClient({
    host: CONFIG.redis.host,
    port: CONFIG.redis.port,
    retry_strategy: function (options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error('The server refused the connection');
      }

      if (options.total_retry_time > 1000 * 12) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error('Retry time exhausted');
      }

      if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
      }

      // reconnect after
      return Math.min(options.attempt * 100, 3000);
    }
  });

  client.on('error', function (err) {
    console.log('Error! client.on("error") caught');

    cleanExit(client, _callbackHash, []);
  });
}

function prettyPrintTimeStamp(unix_timestamp) {
  // var newDate = new Date();

  // newDate.setTime(unix_timestamp * 1000);
  // dateString = newDate.toUTCString();

  // return dateString;

  // var dateObj = moment(unix_timestamp);

  return moment.tz(parseInt(unix_timestamp) * 1000, 'Europe/Kiev').format();
}

function getMaturedBlocks() {
  client.exists('eth:blocks:matured', function (err, reply) {
    if (reply === 1) {
      console.log('Hash "eth:blocks:matured" exists.');

      client.zscan('eth:blocks:matured', 0, 'MATCH', '*', 'COUNT', 20000, function (err, res) {
        let responseArr = [];
        if (err) {
          console.log('Error! client.zscan("eth:blocks:matured")');
        } else {
          if (res[1] && res[1].length && res[1].length >= 2) {
            var blockArr = [];

            for (let i = 0; i < res[1].length; i += 2) {
              blockArr.push({
                idx: parseInt(res[1][i + 1]) - 1,
                data: res[1][i]
              });
            }

            var blockArrSorted = new Array(blockArr.length).fill(0);

            for (let i = 0; i < blockArr.length; i += 1) {
              blockArrSorted[blockArr[i].idx] = blockArr[i].data;
            }

            for (let i = 0; i < blockArrSorted.length; i += 1) {
              let blockObj = null;

              try {
                blockObj = blockArrSorted[i].split(':');
              } catch (err) {
                continue;
              }

              if (blockObj && blockObj.length && blockObj.length >= 5) {
                // console.log('' + (i + 1) + ': ' + blockObj[3] + ', ' + prettyPrintTimeStamp(blockObj[4]));
                responseArr.push({
                  height: i + 1,
                  hash: blockObj[3],
                  timestamp: prettyPrintTimeStamp(blockObj[4])
                });
              }
            }
          } else {
            console.log('No matured blocks.');
          }
        }

        cleanExit(client, _callbackHash, responseArr);
      });
    } else {
      console.log('Hash "eth:blocks:matured" does not exist.');

      cleanExit(client, _callbackHash, []);
    }
  });
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getAllBlocks(callback) {
  _callbackHash = callback;

  setupClient();

  client.hgetall('eth:stats', function (err, reply) {
    if (err) {
      console.log('Error! client.zscan("eth:blocks:matured")');
      console.log(err);
      cleanExit(client, _callbackHash, []);
    } else {
      let totalMatureBlocks = parseInt(reply.lastBlockFound);

      if (isNumber(totalMatureBlocks) && totalMatureBlocks > 0) {
        getMaturedBlocks();
      } else {
        console.log('No mature blocks.');
        cleanExit(client, _callbackHash, []);
      }
    }
  });
}

module.exports = {
  getAllBlocks: getAllBlocks
};
