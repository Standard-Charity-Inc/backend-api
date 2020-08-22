import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import * as bodyParser from 'body-parser';
import express from 'express';

import Config from './config';
import { setCors } from './middleware';
import Redis from './redis';
import { init as initRedis } from './redis/instance';
import Infura from './Infura';
import BN from 'bn.js';

const config = Config[Config.env];

const app: express.Application = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));
app.set('trust proxy', 1);
app.use(setCors);

app.get('/', (_, res) => {
  res.sendStatus(200);
});

const restartApp = (reason: string, timeoutSeconds: number) => {
  console.log(
    `The API will restart in ${timeoutSeconds} seconds. Reason: ${reason}`
  );

  setTimeout(() => {
    startApp();
  }, timeoutSeconds * 1000);
};

const startApp = () => {
  if (!config.ethereum.wallet) {
    return restartApp(
      'A valid wallet mnemonic was not provdided as an environment variable.',
      10
    );
  }

  initRedis().then(async () => {
    new Infura().initializeWebsocket();

    await new Redis().fillCache();

    // const item2 = await new Redis().getAllDonations();

    // console.log('item2:', item2);

    // const item = await new Infura().refundDonation('0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40', 3, new BN('500'))

    // console.log('item:', item);

    app.listen(config.port, () => {
      console.log(
        `Listening in the ${Config.env} environment on port ${config.port}`
      );
    });
  });
};

startApp();
