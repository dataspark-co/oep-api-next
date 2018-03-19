const redisClient = require('./redis-client');
const utils = require('./utils');
const CONFIG = require('../../config.json');

let allBlocksData = [];
let allBlocksFetchSetup = false;

function getMaturedBlocks(client, callback) {
  client.exists('eth:blocks:matured', function (err, reply) {
    if (err) {
      console.log('Error! client.exists("eth:blocks:matured")');
      console.log(err);

      redisClient.stopClient(client, callback, []);

      return;
    }

    if (reply !== 1) {
      console.log('Warning! "reply" !== 1');
      redisClient.stopClient(client, callback, []);

      return;
    }

    client.zscan('eth:blocks:matured', 0, 'MATCH', '*', 'COUNT', 1 * 1000 * 1000, function (err, res) {
      if (err) {
        console.log('Error! client.zscan("eth:blocks:matured")');
        console.log(err);

        redisClient.stopClient(client, callback, []);

        return;
      }

      if (!res[1] || !res[1].length || res[1].length < 2) {
        console.log('Warning! "res" is malformed.');
        redisClient.stopClient(client, callback, []);

        return;
      }

      let blockArr = [];
      let largestIdx = 0;
      for (let i = 0; i < res[1].length; i += 2) {
        let idx = parseInt(res[1][i + 1]) - 1;

        if (idx < 0) {
          continue;
        }

        blockArr.push({
          idx: idx,
          data: res[1][i]
        });

        if (idx > largestIdx) {
          largestIdx = idx;
        }
      }

      let blockArrSorted = new Array(largestIdx + 1).fill(0);
      for (let i = 0; i < blockArr.length; i += 1) {
        blockArrSorted[blockArr[i].idx] = blockArr[i].data;
      }

      let responseArr = [];
      for (let i = 0; i < blockArrSorted.length; i += 1) {
        if (typeof blockArrSorted[i] !== 'string') {
          continue;
        }

        let blockObj = blockArrSorted[i].split(':');

        if (!blockObj || !blockObj.length || blockObj.length < 5) {
          continue;
        }

        responseArr.push({
          height: i + 1,
          hash: blockObj[3],
          timestamp: utils.prettyPrintTimeStamp(blockObj[4])
        });
      }

      redisClient.stopClient(client, callback, responseArr);
    });
  });
}

function getAllBlocks(callback) {
  let client = redisClient.setupClient(callback);

  client.hgetall('eth:stats', function (err, reply) {
    if (err) {
      console.log('Error! client.zscan("eth:blocks:matured")');
      console.log(err);
      redisClient.stopClient(client, callback, []);

      return;
    }

    if (!reply || !reply.lastBlockFound) {
      console.log('Warning! "lastBlockFound" property not found on reply object.');
      redisClient.stopClient(client, callback, []);

      return;
    }

    let totalMatureBlocks = parseInt(reply.lastBlockFound);

    if (utils.isNumber(totalMatureBlocks) && totalMatureBlocks > 0) {
      getMaturedBlocks(client, callback);
    } else {
      console.log('Warning! "totalMatureBlocks" property is invalid.');
      redisClient.stopClient(client, callback, []);
    }
  });
}

function setupAllBlocksFetch() {
  if (allBlocksFetchSetup === true) {
    return;
  }
  allBlocksFetchSetup = true;

  setInterval(() => {
    getAllBlocks((result) => {
      if (!result || !result.length || result.length === 0) {
        return;
      }

      allBlocksData = result;
    });
  }, 3000);
}

function getAllBlocksData() {
  return allBlocksData;
}

module.exports = {
  setupAllBlocksFetch: setupAllBlocksFetch,
  getAllBlocksData: getAllBlocksData
};
