import { Router } from 'express';

import CreateSubscriber from './CreateSubscriber';

export const marketing = Router();

marketing.post('/createSubscriber', (req, res, next) =>
  new CreateSubscriber(req, res, next).init()
);
