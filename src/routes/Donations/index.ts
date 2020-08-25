import { Router } from 'express';

import GetMaxDonation from './GetMaxDonation';

export const donations = Router();

donations.get('/max', (req, res, next) =>
  new GetMaxDonation(req, res, next).init()
);
