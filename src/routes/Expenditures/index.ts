import { Router } from 'express';

import GetTotalEthExpenditures from './GetTotalEthExpenditures';
import GetTotalNumberOfExpenditures from './GetTotalNumberOfExpenditures';
import GetAllExpenditures from './GetAllExpenditures';
import GetPlatesDeployed from './GetPlatesDeployed';
import CreateExpenditure from './CreateExpenditure';

export const expenditures = Router();

expenditures.get('/totalEth', (req, res, next) =>
  new GetTotalEthExpenditures(req, res, next).init()
);

expenditures.get('/totalNumber', (req, res, next) =>
  new GetTotalNumberOfExpenditures(req, res, next).init()
);

expenditures.get('/all', (req, res, next) =>
  new GetAllExpenditures(req, res, next).init()
);

expenditures.get('/plates', (req, res, next) =>
  new GetPlatesDeployed(req, res, next).init()
);

expenditures.post('/create', (req, res, next) =>
  new CreateExpenditure(req, res, next).init()
);
