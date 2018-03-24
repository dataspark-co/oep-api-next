const request = require('request');
const moment = require('moment-timezone');
const CONFIG = require('../../config.json');
const utils = require('./utils');
const numWorkers = require('./num-workers');

let minerHashRateData = {};
let setupHashFetch = {};

const _apiUrl = 'http://' + CONFIG.oldApi.host + ':' + CONFIG.oldApi.port + '/api/accounts';

function minerHashRateFetch(minerId) {
  const apiUrl = _apiUrl + '/' + minerId;

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
        minerHashRateData[minerId].push({
          h: hashRate,
          t: utils.prettyPrintTimeStamp(moment().unix())
        });

        const start = moment(minerHashRateData[minerId][0].t);
        const end = moment().tz('Europe/Kiev');
        const duration = moment.duration(end.diff(start));
        const seconds = duration.asSeconds();

        if (seconds / 60 >= 10) {
          minerHashRateData[minerId].splice(0, 1);
        }
      }
    }
  });
}

function setupSingleMinerHashRateFetch(minerId) {
  if (typeof setupHashFetch[minerId] !== 'undefined') {
    return;
  }

  setupHashFetch[minerId] = true;

  if (typeof minerHashRateData[minerId] === 'undefined') {
    minerHashRateData[minerId] = [];
  }

  setInterval(() => {
    minerHashRateFetch(minerId);
  }, Math.floor(1000 * (Math.random() + 1) * 6)); // Don't hit the real API with simultaneous requests.
}

function setupMinerHashRateFetch() {
  const allMiners = numWorkers.getAllMinersData();
  const allMinersIds = Object.keys(allMiners);

  for (let i = 0; i < allMinersIds.length; i += 1) {
    let minerId = allMinersIds[i];

    if (!minerId || !minerId.length || minerId.length < 1) {
      return;
    }

    if (typeof allMiners[minerId].offline === 'undefined' || allMiners[minerId].offline === true) {
      return;
    }

    setupSingleMinerHashRateFetch(minerId);
  }
}

function getMinerHashRateData(minerId) {
  return minerHashRateData[minerId];
}

module.exports = {
  setupMinerHashRateFetch: setupMinerHashRateFetch,
  getMinerHashRateData: getMinerHashRateData
};
