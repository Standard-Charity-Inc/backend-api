import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetTotalNumberOfDonations extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const totalNumDonations = await new Redis().getTotalNumDonations();

      return this.sendResponse(true, 200, { totalNumDonations } || null, null);
    } catch (e) {
      console.log('GetTotalNumberOfDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message:
          'There was a server error while fetching the total number of donations',
      });
    }
  };
}

export default GetTotalNumberOfDonations;
