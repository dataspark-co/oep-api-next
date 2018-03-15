const request = require('request');
const CONFIG = require('../../config.json');

let allMiners = {};
let numWorkersData = 0;
let numWorkersFetchSetup = false;

const minersApiUrl = 'http://' + CONFIG.oldApi.host + ':' + CONFIG.oldApi.port + '/api/miners';
const minerApiUrlPrefix = 'http://' + CONFIG.oldApi.host + ':' + CONFIG.oldApi.port + '/api/accounts';

function workersFetch(minerHash, callback) {
  const minerApiUrl = minerApiUrlPrefix+ '/' + minerHash;

  request(minerApiUrl, (error, response, body) => {
    if (error) {
      console.log('Error while getting "' + minersApiUrl + '".');
      console.log(error);

      callback();

      return;
    }

    if (response.statusCode !== 200) {
      console.log('Status code "' + response.statusCode + '" while getting "' + minerApiUrl + '".');

      callback();

      return;
    }

    let responseObj = null;

    try {
      responseObj = JSON.parse(body);
    } catch (err) {
      console.log('Error while parsing "' + minerApiUrl + '" response.');
      console.log(err);

      callback();

      return;
    }

    if (!responseObj.workers) {
      callback();

      return;
    }

    callback(responseObj.workers)
  });
}

function numWorkersFetch() {
  request(minersApiUrl, (error, response, body) => {
    if (error) {
      console.log('Error while getting "' + minersApiUrl + '".');
      console.log(error);

      return;
    }

    if (response.statusCode !== 200) {
      console.log('Status code "' + response.statusCode + '" while getting "' + minersApiUrl + '".');

      return;
    }

    let responseObj = null;

    try {
      responseObj = JSON.parse(body);
    } catch (err) {
      console.log('Error while parsing "' + minersApiUrl + '" response.');
      console.log(err);

      return;
    }

    if (!responseObj.miners) {
      return;
    }

    const _allMiners = Object.keys(responseObj.miners);
    const _activeMiners = [];

    for (let i = 0; i < _allMiners.length; i += 1) {
      if (typeof allMiners[_allMiners[i]] === 'undefined') {
        allMiners[_allMiners[i]] = {
          workers: {}
        };
      }

      allMiners[_allMiners[i]].offline = responseObj.miners[_allMiners[i]].offline;

      if (allMiners[_allMiners[i]].offline === false) {
        _activeMiners.push(_allMiners[i]);
      }
    }

    let processedActiveMiners = 0;
    let tempNumWorkers = 0;

    for (let i = 0; i < _activeMiners.length; i += 1) {
      ((i) => {
        setTimeout(() => {
          workersFetch(_activeMiners[i], (workers) => {
            if (typeof workers !== 'undefined') {
              let workerHashes = Object.keys(workers);

              for (let j = 0; j < workerHashes.length; j += 1) {
                if (typeof allMiners[_activeMiners[i]].workers[workerHashes[j]] === 'undefined') {
                  allMiners[_activeMiners[i]].workers[workerHashes[j]] = {};
                }

                allMiners[_activeMiners[i]].workers[workerHashes[j]].offline = workers[workerHashes[j]].offline;

                if (allMiners[_activeMiners[i]].workers[workerHashes[j]].offline === false) {
                  tempNumWorkers += 1;
                }
              }
            }

            processedActiveMiners += 1;

            if (processedActiveMiners === _activeMiners.length) {
              numWorkersData = tempNumWorkers;
            }
          });
        }, (Math.random() + 3) * 100); // Don't hit real API with simultaneous requests.
      })(i);
    }
  });
}

function setupNumWorkersFetch() {
  if (numWorkersFetchSetup === true) {
    return;
  }
  numWorkersFetchSetup = true;

  setInterval(() => {
    numWorkersFetch();
  }, 1000 * 15); // every 15 seconds
}

function getNumWorkersData() {
  return numWorkersData;
}

function getAllMinersData() {
  return allMiners;
}

module.exports = {
  setupNumWorkersFetch: setupNumWorkersFetch,
  getNumWorkersData: getNumWorkersData,
  getAllMinersData: getAllMinersData
};
