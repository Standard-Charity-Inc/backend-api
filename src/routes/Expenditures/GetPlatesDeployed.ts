import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetPlatesDeployed extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const platesDeployed = await new Redis().getTotalPlatesDeployed();

      const totalUsdExpended = await new Redis().getTotalExpendedUsd();

      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      let pricePerPlateUsd = '0.00';

      if (platesDeployed > 0) {
        pricePerPlateUsd = formatter
          .format(totalUsdExpended / 100 / platesDeployed)
          .replace('$', '');
      }

      return this.sendResponse(
        true,
        200,
        { platesDeployed, pricePerPlateUsd },
        null
      );
    } catch (e) {
      console.log('GetPlatesDeployed error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching plates deployed',
      });
    }
  };
}

export default GetPlatesDeployed;
