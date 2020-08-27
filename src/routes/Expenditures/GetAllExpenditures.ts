import { Response } from 'express';
import { orderBy, slice } from 'lodash';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';
import { getPageStartEnd } from '../../utils';

class GetAllExpenditures extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const { page, pageSize } = this.req.query;

      const { error, start, end } = getPageStartEnd(page, pageSize);

      if (error) {
        return this.sendResponse(false, 400, null, {
          message: error,
        });
      }

      const expenditures = orderBy(
        await new Redis().getAllExpenditures(),
        (o) => o.timestamp
      );

      return this.sendResponse(
        true,
        200,
        {
          expenditures: slice(expenditures, start, end),
          total: expenditures.length,
        },
        null
      );
    } catch (e) {
      console.log('GetAllExpenditures error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching expenditures',
      });
    }
  };
}

export default GetAllExpenditures;
