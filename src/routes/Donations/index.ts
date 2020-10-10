import { Router } from 'express';

import GetMaxDonation from './GetMaxDonation';
import GetLatestDonation from './GetLatestDonation';
import GetTotalNumberOfDonations from './GetTotalNumberOfDonations';
import GetAllDonations from './GetAllDonations';
import GetTotalEthDonations from './GetTotalEthDonations';
import GetDonationsGroupedBy from './GetDonationsGroupedBy';

export const donations = Router();

donations.get('/max', (req, res, next) =>
  new GetMaxDonation(req, res, next).init()
);

donations.get('/latest', (req, res, next) =>
  new GetLatestDonation(req, res, next).init()
);

donations.get('/totalEth', (req, res, next) =>
  new GetTotalEthDonations(req, res, next).init()
);

donations.get('/totalNumber', (req, res, next) =>
  new GetTotalNumberOfDonations(req, res, next).init()
);

donations.get('/grouped', (req, res, next) => {
  new GetDonationsGroupedBy(req, res, next).init();
});

donations.get('/all', (req, res, next) =>
  new GetAllDonations(req, res, next).init()
);
