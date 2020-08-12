import { NextFunction, Request, Response } from 'express';

import Config from '../config';

const config = Config[Config.env];

export const setCors = (_: Request, res: Response, next: NextFunction) => {
  res.header(Config.cors);

  next();
};
