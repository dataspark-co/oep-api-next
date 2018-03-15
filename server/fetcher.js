const poolHashRate = require('./fetcher-helpers/pool-hash-rate');
const allBlocks = require('./fetcher-helpers/all-blocks');

function getAllBlocks() {
  allBlocks.setupAllBlocksFetch();

  return allBlocks.getAllBlocksData();
}

function getPoolHashRate() {
  poolHashRate.setupPoolHashRateFetch();

  return poolHashRate.getPoolHashRateData();
}

module.exports = {
  getAllBlocks: getAllBlocks,
  getPoolHashRate: getPoolHashRate
};
