const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger-config.yaml');

const CONFIG = require('./config.json');

const RouteLogMiddleware = require('./server/middleware/route-log-middleware');
const CorsMiddleware = require('./server/middleware/cors-middleware');
const CatchErrorMiddleware = require('./server/middleware/catch-error-middleware');

const Router = require('./server/router');

const app = express();
const port = CONFIG.api.port;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(RouteLogMiddleware);

app.use(CorsMiddleware);

app.get('/api/blocks', Router.getAllBlocks);
app.get('/api/server_time', Router.getServerTime);
app.get('/api/pool_hash_rate', Router.getPoolHashRate);
app.get('/api/get_num_workers', Router.getNumWorkers);
app.get('/api/miner_hash_rate/:minerId', Router.getMinerHashRate);
app.get('/api/news', Router.getServerNews);
app.get('/api/*', Router.unknownApiError);

app.get('/*', Router.notFound);

app.use(CatchErrorMiddleware);

app.listen(port, (err) => {
  if (err) {
    console.log('Error while starting Express Server:');
    console.log(err);

    return;
  }

  console.log(`Express Server is listening on ${port}.`);
});
