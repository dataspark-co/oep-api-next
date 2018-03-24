const poolHashRate = require('./fetcher-helpers/pool-hash-rate');
const allBlocks = require('./fetcher-helpers/all-blocks');
const numWorkers = require('./fetcher-helpers/num-workers');
const minerHashRate = require('./fetcher-helpers/miner-hash-rate');

function getAllBlocks() {
  allBlocks.setupAllBlocksFetch();

  return allBlocks.getAllBlocksData();
}

function getPoolHashRate() {
  poolHashRate.setupPoolHashRateFetch();

  return poolHashRate.getPoolHashRateData();
}

function getNumWorkers() {
  numWorkers.setupNumWorkersFetch();

  return numWorkers.getNumWorkersData();
}

function getAllMiners() {
  numWorkers.setupNumWorkersFetch();

  return numWorkers.getAllMinersData();
}

function getMinerHashRate(minerId) {
  minerHashRate.setupMinerHashRateFetch();

  return minerHashRate.getMinerHashRateData(minerId);
}

module.exports = {
  getAllBlocks: getAllBlocks,
  getPoolHashRate: getPoolHashRate,
  getNumWorkers: getNumWorkers,
  getAllMiners: getAllMiners,
  getMinerHashRate: getMinerHashRate
};
