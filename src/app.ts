import * as bodyParser from 'body-parser';
import * as express from 'express';

import Config from './config';
import { setCors } from './middleware';

const config = Config[Config.env];

const app: express.Application = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));
app.set('trust proxy', 1);
app.use(setCors);

app.get('/', (_, res) => {
  res.sendStatus(200);
});

app.listen(config.port, () => {
  console.log(
    `Listening in the ${Config.env} environment on port ${config.port}`
  );
});
