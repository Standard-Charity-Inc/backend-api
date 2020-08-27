import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetTotalEthExpenditures extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const totalExpendedEth = await new Redis().getTotalExpendedEth();

      return this.sendResponse(true, 200, { totalExpendedEth }, null);
    } catch (e) {
      console.log('GetTotalEthExpenditures error:', e);

      return this.sendResponse(false, 500, null, {
        message:
          'There was a server error while fetching total expenditures denominated in ETH',
      });
    }
  };
}

export default GetTotalEthExpenditures;
