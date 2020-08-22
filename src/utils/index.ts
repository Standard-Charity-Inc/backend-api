import Config from '../config';
import Infura from '../Infura';

const config = Config[Config.env];

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
