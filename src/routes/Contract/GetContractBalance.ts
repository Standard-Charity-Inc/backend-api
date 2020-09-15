import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetContractBalance extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const contractBalance = await new Redis().getStandardCharityContractBalance();

      return this.sendResponse(true, 200, { contractBalance }, null);
    } catch (e) {
      console.log('GetTotalEthDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching the contract balance',
      });
    }
  };
}

export default GetContractBalance;
