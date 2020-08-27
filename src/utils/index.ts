import validator from 'validator';

import Config from '../config';
import Infura from '../Infura';

const config = Config[Config.env];

export interface IPage {
  start: number;
  end: number;
  error?: string;
}

export const getSignedTx = async (
  data: string,
  value?: number
): Promise<string | null> => {
  try {
    if (!config.ethereum.wallet) {
      console.log('Could not get wallet in getSignedTx');

      return null;
    }

    const infura = new Infura();

    const nonce = await infura.getTransactionCount(
      config.ethereum.wallet.address.toString()
    );

    if (!nonce || isNaN(nonce)) {
      console.log('Could not get nonce in getSignedTx');

      return null;
    }

    const gasPrice = await infura.getGasPrice();

    if (!gasPrice) {
      console.log('Could not get gas price in utils');

      return null;
    }

    const gasEstimate = await infura.estimateGas(
      config.ethereum.wallet.address.toString(),
      config.contracts.standardCharity.address,
      gasPrice,
      value || 0,
      data
    );

    if (!gasEstimate) {
      console.log('Could not get gas estimate in utils');

      return null;
    }

    const tx: any = {
      to: config.contracts.standardCharity.address,
      from: config.ethereum.wallet.address.toString(),
      data,
      value: 0,
      nonce,
      gasPrice,
      gasLimit: gasEstimate,
    };

    const signedTx = await config.ethereum.wallet.signTransaction(tx);

    return signedTx;
  } catch (e) {
    console.log('getSignedTx error:', e);

    return null;
  }
};

export const numPlatesToFloating = (numPlates: string): number => {
  try {
    if (!numPlates) {
      return 0;
    }

    const numPlatesNum = Number(numPlates);

    if (isNaN(numPlatesNum)) {
      return 0;
    }

    const floating = Number(
      (Math.round((numPlatesNum / 10) * 10) / 10).toFixed(1)
    );

    if (isNaN(floating)) {
      return 0;
    }

    return floating;
  } catch (e) {
    console.log('numPlatesToFloating error:', e);

    return 0;
  }
};

export const getPageStartEnd = (page: any, pageSize: any): IPage => {
  try {
    if (!page || !validator.isInt(page.toString())) {
      return {
        start: 0,
        end: 0,
        error: 'The page paramater must be provided as an integer',
      };
    }

    if (!pageSize || !validator.isInt(pageSize.toString())) {
      return {
        start: 0,
        end: 0,
        error: 'The pageSize paramater must be provided as an integer',
      };
    }

    const size = Number(pageSize) < 100 ? Number(pageSize) : 100;

    const start = (Number(page) - 1) * size;

    const end = Number(page) * size;

    return {
      start,
      end,
    };
  } catch (e) {
    return {
      start: 0,
      end: 0,
      error: 'Could not get determine which page of data to return',
    };
  }
};
