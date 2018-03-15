const fetcher = require('./fetcher');
const utils = require('./util');

const Router = {};

Router.notFound = (request, response) => {
  response.status(404);
  response.send('Not found.');
};

Router.getAllBlocks = (request, response) => {
  fetcher.getAllBlocks(function (outputObj) {
    response.json(outputObj);
  });
};

Router.getServerTime = (request, response) => {
  response.json({
    timestamp: utils.serverTime()
  });
};

Router.getPoolHashRate = (request, response) => {
  response.json({
    poolHashRate: fetcher.getPoolHashRate()
  });
};

Router.unknownApiError = (request, response) => {
  response.status(404);
  response.send('The API does not contain a "' + request.url + '" route.');
};

module.exports = Router;
