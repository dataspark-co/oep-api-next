const redisClient = require('./redis-client');
const utils = require('./utils');
const CONFIG = require('../../config.json');

let allBlocksData = [];
let allBlocksFetchSetup = false;

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
                  timestamp: utils.prettyPrintTimeStamp(blockObj[4])
                });
              }
            }
          } else {
            console.log('No matured blocks.');
          }
        }

        redisClient.stopClient(client, callback, responseArr);
      });
    } else {
      console.log('Hash "eth:blocks:matured" does not exist.');

      redisClient.stopClient(client, callback, []);
    }
  });
}

function getAllBlocks(callback) {
  let client = redisClient.setupClient(callback);

  client.hgetall('eth:stats', function (err, reply) {
    if (err) {
      console.log('Error! client.zscan("eth:blocks:matured")');
      console.log(err);
      redisClient.stopClient(client, callback, []);
    } else {
      let totalMatureBlocks = parseInt(reply.lastBlockFound);

      if (utils.isNumber(totalMatureBlocks) && totalMatureBlocks > 0) {
        getMaturedBlocks(client, callback);
      } else {
        console.log('No mature blocks.');
        redisClient.stopClient(client, callback, []);
      }
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
