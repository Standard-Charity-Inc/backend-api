import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetTotalUsdExpenditures extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const totalExpendedUsd = await new Redis().getTotalExpendedUsd();

      return this.sendResponse(true, 200, { totalExpendedUsd }, null);
    } catch (e) {
      console.log('GetTotalUsdExpenditures error:', e);

      return this.sendResponse(false, 500, null, {
        message:
          'There was a server error while fetching total expenditures denominated in USD',
      });
    }
  };
}

export default GetTotalUsdExpenditures;
