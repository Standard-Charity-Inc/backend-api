import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import { getGasPrice } from '../../utils/blocknative';
import StandardCharityContractFunctions from '../../Infura/StandardCharity/ContractFunctions';

class GetGasPrice extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const gasPriceEip1559 = await getGasPrice();

      const gasPrice = await new StandardCharityContractFunctions().getGasPrice();

      return this.sendResponse(
        true,
        200,
        gasPriceEip1559 ? { ...gasPriceEip1559 } : { gasPrice },
        null
      );
    } catch (e) {
      console.log('GetGasPrice error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching the gas price',
      });
    }
  };
}

export default GetGasPrice;
