import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetMaxDonation extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const topDonation = await new Redis().getMaxDonation();

      return this.sendResponse(true, 200, topDonation || null, null);
    } catch (e) {
      console.log('GetMaxDonation error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching the maximum donation',
      });
    }
  };
}

export default GetMaxDonation;
