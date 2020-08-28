import * as ethers from 'ethers';
import Web3 from 'web3';
import { find } from 'lodash';

import { ContractFunctionName } from '../types';

export const mnemonicToWallet = (mnemonic: string): ethers.Wallet | null => {
  try {
    return ethers.Wallet.fromMnemonic(mnemonic);
  } catch (e) {
    console.log('mnemonicToWallet error:', e);

    return null;
  }
};

export const encodeCallData = (
  abi: any,
  functionName: ContractFunctionName,
  inputs: any[]
): string | null => {
  try {
    const iface = new ethers.utils.Interface(abi);

    return iface.encodeFunctionData(functionName, [...inputs]);
  } catch (e) {
    console.log('encodeCallData error:', e);

    return null;
  }
};

export const decodeFunctionResult = (
  abi: any,
  functionName: ContractFunctionName,
  data: string,
  abiItemName?: 'inputs'
): { [key: string]: any } | null => {
  try {
    const web3 = new Web3();

    const abiItem = find(abi, (o) => o.name === functionName);

    const decodedParams = web3.eth.abi.decodeParameters(
      abiItem[abiItemName || 'outputs'],
      data
    );

    return decodedParams;
  } catch (e) {
    console.log('decodeFunctionData error:', e);

    return null;
  }
};
