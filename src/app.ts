import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import * as bodyParser from 'body-parser';
import express from 'express';

import Config from './config';
import { setCors } from './middleware';
import { init as initRedis } from './redis';
import Infura from './Infura';

const config = Config[Config.env];

const app: express.Application = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));
app.set('trust proxy', 1);
app.use(setCors);

app.get('/', (_, res) => {
  res.sendStatus(200);
});

initRedis().then(() => {
  new Infura().initializeWebsocket();

  app.listen(config.port, () => {
    console.log(
      `Listening in the ${Config.env} environment on port ${config.port}`
    );
  });
});
