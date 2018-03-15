const redis = require('redis');
const CONFIG = require('../../config.json');

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

    stopClient(client, callback, []);
  });

  return client;
}

function stopClient(client, callback, responseArr) {
  client.end(true);
  client.quit();

  callback(responseArr);
}

module.exports = {
  setupClient: setupClient,
  stopClient: stopClient
};
