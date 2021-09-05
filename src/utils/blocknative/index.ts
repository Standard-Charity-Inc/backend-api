import superagent from 'superagent';
import { IBlocknativeBlockPrices, IEIP1559Gas } from '../../types';

import Config from '../../config';
import { find } from 'lodash';
import { gweiToWei } from '../ethereum';

const config = Config[Config.env];

export const getGasPrice = async (): Promise<IEIP1559Gas | null> => {
  try {
    const res = await superagent
      .get(`${config.blocknative.api.url}/gasprices/blockprices`)
      .set({
        Authorization: config.blocknative.api.key,
      });

    if (!res || !res.body) {
      console.log('Could not get blocknative getGasPrice');

      return null;
    }

    const blocknativeRes = res.body as IBlocknativeBlockPrices;

    console.log('blocknativeRes:', JSON.stringify(blocknativeRes));

    if (
      !blocknativeRes.blockPrices ||
      !Array.isArray(blocknativeRes.blockPrices) ||
      blocknativeRes.blockPrices.length === 0
    ) {
      console.log('blocknative blockPrices was invalid');

      return null;
    }

    if (
      !blocknativeRes.blockPrices[0].estimatedPrices ||
      !Array.isArray(blocknativeRes.blockPrices[0].estimatedPrices) ||
      blocknativeRes.blockPrices[0].estimatedPrices.length === 0
    ) {
      console.log('blocknative estimatedPrices was invalid');

      return null;
    }

    // Use 95% confidence value
    const gas = find(
      blocknativeRes.blockPrices[0].estimatedPrices,
      (o) => o.confidence === 95
    );

    if (!gas || !gas.maxFeePerGas || !gas.maxPriorityFeePerGas) {
      console.log('blocknative could not find 95% confidence gas');

      return null;
    }

    const maxFeePerGas = gweiToWei(gas.maxFeePerGas.toString());

    const maxPriorityFeePerGas = gweiToWei(gas.maxPriorityFeePerGas.toString());

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      console.log('blocknative could not get wei from gwei in gas prices');

      return null;
    }

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  } catch (e) {
    console.log('blocknative getGasPrice error:', e);

    return null;
  }
};
