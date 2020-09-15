import { Router } from 'express';

import GetContractBalance from './GetContractBalance';

export const contract = Router();

contract.get('/balance', (req, res, next) =>
  new GetContractBalance(req, res, next).init()
);
