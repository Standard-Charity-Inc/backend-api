import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetLatestDonation extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const latestDonation = await new Redis().getLatestDonation();

      return this.sendResponse(true, 200, latestDonation || null, null);
    } catch (e) {
      console.log('GetLatestDonation error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching the laatest donation',
      });
    }
  };
}

export default GetLatestDonation;
