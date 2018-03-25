const moment = require('moment-timezone');
const redisClient = require('./redis-client');
const utils = require('./utils');
const CONFIG = require('../../config.json');

let allBlocksData = [];
let allBlocksFetchSetup = false;

function compareBlocks(a, b) {
  if (a.height > b.height) {
    return 1;
  } else if (a.height < b.height) {
    return -1;
  }

  return 0;
}

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

      const endDate = moment().tz('Europe/Kiev');

      let blockArr = [];
      for (let i = 0; i < res[1].length; i += 2) {
        if (i >= res[1].length) {
          break;
        }

        if (typeof res[1][i] !== 'string') {
          continue;
        }
        let blockParams = res[1][i].split(':');

        if (!blockParams || !blockParams.length || blockParams.length < 5) {
          continue;
        }

        let timestamp = utils.prettyPrintTimeStamp(blockParams[4]);

        const startDate = moment(timestamp);
        const duration = moment.duration(endDate.diff(startDate));
        const minutes = duration.asMinutes();

        if ((minutes / 60) >= 25) {
          continue;
        }

        let hash = blockParams[3];

        if (typeof res[1][i + 1] !== 'string') {
          continue;
        }
        let height = parseInt(res[1][i + 1]);

        blockArr.push({
          height: height,
          hash: hash,
          timestamp: timestamp
        });
      }

      blockArr.sort(compareBlocks);

      redisClient.stopClient(client, callback, blockArr);
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
