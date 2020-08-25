import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetTotalEthDonations extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const totalDonationsEth = await new Redis().getTotalDonationsEth();

      return this.sendResponse(true, 200, { totalDonationsEth }, null);
    } catch (e) {
      console.log('GetTotalEthDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message:
          'There was a server error while fetching total donations denominated in ETH',
      });
    }
  };
}

export default GetTotalEthDonations;
