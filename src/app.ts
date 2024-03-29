import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import * as bodyParser from 'body-parser';
import express from 'express';
import fileUpload from 'express-fileupload';
import AWS from 'aws-sdk';
// import { CronJob } from 'cron';
import cors from 'cors';

import Config from './config';
import Redis from './redis';
import { init as initRedis } from './redis/instance';
import Infura from './Infura';
import { donations } from './routes/Donations';
import { expenditures } from './routes/Expenditures';
import { expendedDonations } from './routes/ExpendedDonations';
import { receipts } from './routes/Receipts';
import { marketing } from './routes/Marketing';
import { contract } from './routes/Contract';
import { utils } from './routes/Utils';
import { IResponse } from './routes/StandardRoute';
// import CheckForRefunds from './routes/Refunds/CheckForRefunds';

const config = Config[Config.env];

const app: express.Application = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '995mb' }));
app.set('trust proxy', 1);
app.use(cors());

const maxUploadSizeMb = 995;

app.use(
  fileUpload({
    limits: { fileSize: maxUploadSizeMb * 1024 * 1024 },
    uploadTimeout: 3600000,
    useTempFiles: true,
    tempFileDir: `${__dirname}/routes/Expenditures/tmp`,
    debug: true,
    limitHandler: (_, res, __) => {
      const response: IResponse = {
        ok: false,
        payload: null,
        error: {
          message: `The file size exceeds the maximum upload size of ${maxUploadSizeMb} MB`,
        },
      };

      return res.json(response).status(400);
    },
  })
);

app.get('/', (_, res) => {
  res.sendStatus(200);
});

app.use('/donations', donations);
app.use('/expenditures', expenditures);
app.use('/expendedDonations', expendedDonations);
app.use('/receipts', receipts);
app.use('/marketing', marketing);
app.use('/contract', contract);
app.use('/utils', utils);

// let cronJob: CronJob | null = null;

const restartApp = (reason: string, timeoutSeconds: number) => {
  // if (cronJob) {
  //   cronJob.stop();

  //   cronJob = null;
  // }

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

  if (
    !config.aws.accessKey ||
    !config.aws.secretAccessKey ||
    !config.aws.s3.bucketName
  ) {
    return restartApp('Missing AWS credentials in environment variables', 10);
  }

  initRedis().then(async () => {
    AWS.config.update({
      region: 'us-east-1',
      accessKeyId: config.aws.accessKey,
      secretAccessKey: config.aws.secretAccessKey,
    });

    new Infura().initializeWebsocket();

    await new Redis().fillCache();

    // cronJob = new CronJob(
    //   '0 4 * * *',
    //   function () {
    //     new CheckForRefunds().init();
    //   },
    //   null,
    //   true,
    //   'America/New_York'
    // );

    // cronJob.start();

    const server = app.listen(config.port, () => {
      console.log(
        `Listening in the ${Config.env} environment on port ${config.port}`
      );
    });

    server.headersTimeout = 3600000;
  });
};

startApp();
