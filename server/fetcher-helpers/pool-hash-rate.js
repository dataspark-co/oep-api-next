const request = require('request');
const moment = require('moment-timezone');
const CONFIG = require('../../config.json');
const utils = require('./utils');

let poolHashRateData = [];
let poolHashRateFetchSetup = false;

const apiUrl = 'http://' + CONFIG.oldApi.host + ':' + CONFIG.oldApi.port + '/api/stats';

function poolHashRateFetch() {
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

      if (utils.isNumber(hashRate)) {
        poolHashRateData.push({
          h: hashRate,
          t: utils.prettyPrintTimeStamp(moment().unix())
        });

        if (poolHashRateData.length > 10 * 10) {
          poolHashRateData.splice(0, 1);
        }
      }
    }
  });
}

function setupPoolHashRateFetch() {
  if (poolHashRateFetchSetup === true) {
    return;
  }
  poolHashRateFetchSetup = true;

  setInterval(() => {
    poolHashRateFetch();
  }, 1000 * 6); // every 6 seconds
}

function getPoolHashRateData() {
  return poolHashRateData;
}

module.exports = {
  setupPoolHashRateFetch: setupPoolHashRateFetch,
  getPoolHashRateData: getPoolHashRateData
};
