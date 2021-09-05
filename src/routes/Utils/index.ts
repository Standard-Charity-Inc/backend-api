import { Router } from 'express';

import GetGasPrice from './GetGasPrice';

export const utils = Router();

utils.get('/gasPrice', (req, res, next) =>
  new GetGasPrice(req, res, next).init()
);
