import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetTotalNumberOfExpenditures extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const totalNumExpenditures = await new Redis().getTotalNumExpenditures();

      return this.sendResponse(
        true,
        200,
        { totalNumExpenditures } || null,
        null
      );
    } catch (e) {
      console.log('GetTotalNumberOfExpenditures error:', e);

      return this.sendResponse(false, 500, null, {
        message:
          'There was a server error while fetching the total number of expenditures',
      });
    }
  };
}

export default GetTotalNumberOfExpenditures;
