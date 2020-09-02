import { Router } from 'express';

import GetAllExpendedDonations from './GetAllExpendedDonations';

export const expendedDonations = Router();

expendedDonations.get('/all', (req, res, next) =>
  new GetAllExpendedDonations(req, res, next).init()
);
