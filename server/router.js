const fs = require('fs');
const fetcher = require('./fetcher');

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

Router.unknownApiError = (request, response) => {
  response.status(404);
  response.send('The API does not contain a "' + request.url + '" route.');
};

module.exports = Router;
