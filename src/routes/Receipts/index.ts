import { Router } from 'express';

import GetReceipt from './GetReceipt';

export const receipts = Router();

receipts.get('/', (req, res, next) => new GetReceipt(req, res, next).init());
