const redis = require('redis');
const moment = require('moment-timezone');
const request = require('request');

const CONFIG = require('../config.json');

function cleanExit(client, callback, responseArr) {
  client.end(true);
  client.quit();

  callback(responseArr);
}

function setupClient(callback) {
  let client = redis.createClient({
    host: CONFIG.redis.host,
    port: CONFIG.redis.port,
    retry_strategy: function (options) {
      console.log('redis::retry_strategy');

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

    cleanExit(client, callback, []);
  });

  return client;
}

function prettyPrintTimeStamp(unix_timestamp) {
  return moment.tz(parseInt(unix_timestamp) * 1000, 'Europe/Kiev').format();
}

function getMaturedBlocks(client, callback) {
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

        cleanExit(client, callback, responseArr);
      });
    } else {
      console.log('Hash "eth:blocks:matured" does not exist.');

      cleanExit(client, callback, []);
    }
  });
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getAllBlocks(callback) {
  let client = setupClient(callback);

  console.log('111');

  client.hgetall('eth:stats', function (err, reply) {
    console.log('222');
    if (err) {
      console.log('Error! client.zscan("eth:blocks:matured")');
      console.log(err);
      cleanExit(client, callback, []);
    } else {
      let totalMatureBlocks = parseInt(reply.lastBlockFound);

      if (isNumber(totalMatureBlocks) && totalMatureBlocks > 0) {
        getMaturedBlocks(client, callback);
      } else {
        console.log('No mature blocks.');
        cleanExit(client, callback, []);
      }
    }
  });
}

let poolHashRateData = [];
let poolHashRateFetchSetup = false;

function setupPoolHashRateFetch() {
  if (poolHashRateFetchSetup === true) {
    return;
  }
  poolHashRateFetchSetup = true;

  const apiUrl = 'http://' + CONFIG.oldApi.host + ':' + CONFIG.oldApi.port + '/api/stats';

  setInterval(() => {
    request(apiUrl, (error, response, body) => {
      if (error) {
        console.log('Error while getting "' + apiUrl + '".');
        console.log(error);

        return;
      }

      if (response.statusCode !== 200) {
        console.log('Status code "' + response.statusCode + '" while getting "' + apiUrl + '".');

        return;
      }

      let responseObj = null;

      try {
        responseObj = JSON.parse(body);
      } catch (err) {
        console.log('Error while parsing "' + apiUrl + '" response.');
        console.log(err);

        return;
      }

      if (responseObj && responseObj.hashrate) {
        const hashRate = parseInt(responseObj.hashrate);

        if (isNumber(hashRate)) {
          poolHashRateData.push({
            h: hashRate,
            t: prettyPrintTimeStamp(moment().unix())
          });
        }
      }
    })
  }, 3000);
}

function getPoolHashRate() {
  setupPoolHashRateFetch();

  return poolHashRateData;
}

module.exports = {
  getAllBlocks: getAllBlocks,
  getPoolHashRate: getPoolHashRate
};
