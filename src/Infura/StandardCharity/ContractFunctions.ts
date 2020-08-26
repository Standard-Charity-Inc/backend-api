import superagent from 'superagent';
import Web3 from 'web3';
import BN from 'bn.js';

import {
  ContractFunctionName,
  ISpotlightDonation,
  IDonationTrackerItem,
  IDonation,
  IExpenditure,
  IExpendedDonation,
} from '../../types';
import { encodeCallData, decodeFunctionResult } from '../../utils/ethereum';
import { getSignedTx } from '../../utils';
import Config from '../../config';

const config = Config[Config.env];

interface ICallContractFunction {
  from: string;
  to: string;
  data: string;
  gas?: string;
  gasPrice?: string;
  value?: number;
}

class StandardCharityContractFunctions {
  standardCharityAbi: any;

  constructor() {
    try {
      this.standardCharityAbi = require(config.contracts.standardCharity
        .abiFilePath);
    } catch (e) {
      console.log('Error getting Standard Charity ABI:', e);
    }
  }

  public callStandardCharityContract = async (
    functionName: ContractFunctionName,
    value: number,
    inputs: any[]
  ): Promise<any> => {
    try {
      if (!config.ethereum.wallet) {
        console.log('Could not call Standard Charity contrct. Wallet was null');

        return null;
      }

      const callData = encodeCallData(
        this.standardCharityAbi.abi,
        functionName,
        inputs
      );

      if (!callData) {
        console.log('Call data was null');

        return null;
      }

      const callObject: ICallContractFunction = {
        from: config.ethereum.wallet.address,
        to: config.contracts.standardCharity.address,
        data: callData,
      };

      if (value) {
        callObject.value = value;
      }

      const res = await superagent
        .post(`${config.infura.endpoint}`)
        .set({
          'Content-Type': 'application/json',
        })
        .send({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [callObject, 'latest'],
          id: Math.floor(Math.random() * Math.floor(9999999)),
        });

      if (!res || !res.body || !res.body.result) {
        console.log('Could not get Infura response:', res);

        return null;
      }

      return decodeFunctionResult(
        this.standardCharityAbi.abi,
        functionName,
        res.body.result
      );
    } catch (e) {
      console.log('readStandardCharityContract error:', e);

      return null;
    }
  };

  public sendRawTransaction = async (
    functionName: ContractFunctionName,
    inputs: any[]
  ): Promise<any> => {
    try {
      const callData = encodeCallData(
        this.standardCharityAbi.abi,
        functionName,
        inputs
      );

      if (!callData) {
        console.log('Could not get callData in sendRawTransaction in Infura');

        return null;
      }

      const signedTx = await getSignedTx(callData);

      if (!signedTx) {
        console.log('Could not get signedTx in sendRawTransaction in Infura');

        return null;
      }

      const res = await superagent
        .post(`${config.infura.endpoint}`)
        .set({
          'Content-Type': 'application/json',
        })
        .send({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [signedTx],
          id: Math.floor(Math.random() * Math.floor(9999999)),
        });

      if (!res || !res.body || !res.body.result) {
        console.log('Could not get result in sendRawTransaction in Infura');

        return null;
      }

      return decodeFunctionResult(
        this.standardCharityAbi.abi,
        functionName,
        res.body.result
      );
    } catch (e) {
      console.log('sendRawTransaction Infura error:', e);

      return null;
    }
  };

  public getTransactionCount = async (
    address: string
  ): Promise<number | null> => {
    try {
      const res = await superagent
        .post(`${config.infura.endpoint}`)
        .set({
          'Content-Type': 'application/json',
        })
        .send({
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
          id: Math.floor(Math.random() * Math.floor(9999999)),
        });

      if (res && res.body && res.body.result) {
        return parseInt(res.body.result, 16);
      }

      return null;
    } catch (e) {
      console.log('getTransactionCount in Infura error:', e);

      return null;
    }
  };

  public getGasPrice = async (): Promise<number | null> => {
    try {
      const res = await superagent
        .post(`${config.infura.endpoint}`)
        .set({
          'Content-Type': 'application/json',
        })
        .send({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: Math.floor(Math.random() * Math.floor(9999999)),
        });

      if (res && res.body && res.body.result) {
        return parseInt(res.body.result, 16);
      }

      return null;
    } catch (e) {
      console.log('getGasPrice Infura error:', e);

      return null;
    }
  };

  public estimateGas = async (
    from: string,
    to: string,
    gasPrice: number,
    value: number,
    data: string
  ): Promise<number | null> => {
    try {
      const res = await superagent
        .post(`${config.infura.endpoint}`)
        .set({
          'Content-Type': 'application/json',
        })
        .send({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [
            {
              from,
              to,
              gasPrice: `0x${Number(gasPrice).toString(16)}`,
              value: `0x${Number(value).toString(16)}`,
              data,
            },
          ],
          id: Math.floor(Math.random() * Math.floor(9999999)),
        });

      if (res && res.body && res.body.result) {
        return parseInt(res.body.result, 16);
      }

      return null;
    } catch (e) {
      console.log('estimateGas error in Infura:', e);

      return null;
    }
  };

  public getTotalNumDonations = async (): Promise<number> => {
    try {
      const totalNumDonations = await this.callStandardCharityContract(
        'getTotalNumDonations',
        0,
        []
      );

      return totalNumDonations && totalNumDonations['0']
        ? Number(totalNumDonations['0'])
        : 0;
    } catch (e) {
      console.log('getTotalNumDonations Infura error:', e);

      return 0;
    }
  };

  public getTotalNumExpenditures = async (): Promise<number> => {
    try {
      const totalNumExpenditures = await this.callStandardCharityContract(
        'getTotalNumExpenditures',
        0,
        []
      );

      return totalNumExpenditures && totalNumExpenditures['0']
        ? Number(totalNumExpenditures['0'])
        : 0;
    } catch (e) {
      console.log('totalNumExpenditures Infura error:', e);

      return 0;
    }
  };

  public getTotalNumExpendedDonations = async (): Promise<number> => {
    try {
      const totalNumExpendedDonations = await this.callStandardCharityContract(
        'getTotalNumExpendedDonations',
        0,
        []
      );

      return totalNumExpendedDonations && totalNumExpendedDonations['0']
        ? Number(totalNumExpendedDonations['0'])
        : 0;
    } catch (e) {
      console.log('getTotalNumExpendedDonations Infura error:', e);

      return 0;
    }
  };

  public getStandardCharityContractBalance = async (): Promise<string> => {
    try {
      const contractBalance = await this.callStandardCharityContract(
        'getContractBalance',
        0,
        []
      );

      return contractBalance && contractBalance['0']
        ? contractBalance['0']
        : '0';
    } catch (e) {
      console.log('getContractBalance Infura error:', e);

      return '0';
    }
  };

  public getTotalPlatesDeployed = async (): Promise<string> => {
    try {
      const totalPlatesDeployed = await this.callStandardCharityContract(
        'totalPlatesDeployed',
        0,
        []
      );

      return totalPlatesDeployed && totalPlatesDeployed['0']
        ? totalPlatesDeployed['0']
        : '0';
    } catch (e) {
      console.log('getTotalPlatesDeployed in Infura error:', e);

      return '0';
    }
  };

  public getMaxDonation = async (): Promise<ISpotlightDonation | null> => {
    try {
      const maxDonation = await this.callStandardCharityContract(
        'maxDonation',
        0,
        []
      );

      if (
        !maxDonation.donator ||
        !maxDonation.value ||
        !maxDonation.timestamp
      ) {
        return null;
      }

      return {
        donator: maxDonation.donator,
        value: maxDonation.value,
        timestamp: Number(maxDonation.timestamp),
      };
    } catch (e) {
      console.log('getMaxDonation Infura error:', e);

      return null;
    }
  };

  public getLatestDonation = async (): Promise<ISpotlightDonation | null> => {
    try {
      const latestDonation = await this.callStandardCharityContract(
        'latestDonation',
        0,
        []
      );

      if (
        !latestDonation.donator ||
        !latestDonation.value ||
        !latestDonation.timestamp
      ) {
        return null;
      }

      return {
        donator: latestDonation.donator,
        value: latestDonation.value,
        timestamp: Number(latestDonation.timestamp),
      };
    } catch (e) {
      console.log('getLatestDonation Infura error:', e);

      return null;
    }
  };

  public getNextDonationToExpend = async (): Promise<number | null> => {
    try {
      const nextDonationToExpend = await this.callStandardCharityContract(
        'nextDonationToExpend',
        0,
        []
      );

      return nextDonationToExpend && nextDonationToExpend['0']
        ? Number(nextDonationToExpend['0'])
        : null;
    } catch (e) {
      console.log('getNextDonationToExpend Infura error:', e);

      return 0;
    }
  };

  public getTotalDonationsEth = async (): Promise<string> => {
    try {
      const totalDonationsEth = await this.callStandardCharityContract(
        'totalDonationsETH',
        0,
        []
      );

      return totalDonationsEth && totalDonationsEth['0']
        ? totalDonationsEth['0']
        : '0';
    } catch (e) {
      console.log('getTotalDonationsEth Infura error:', e);

      return '0';
    }
  };

  public getTotalExpendedEth = async (): Promise<string> => {
    try {
      const totalExpendedEth = await this.callStandardCharityContract(
        'totalExpendedETH',
        0,
        []
      );

      return totalExpendedEth && totalExpendedEth['0']
        ? totalExpendedEth['0']
        : '0';
    } catch (e) {
      console.log('getTotalExpendedEth Infura error:', e);

      return '0';
    }
  };

  public getTotalExpendedUsd = async (): Promise<number> => {
    try {
      const totalExpendedUsd = await this.callStandardCharityContract(
        'totalExpendedUSD',
        0,
        []
      );

      return totalExpendedUsd && totalExpendedUsd['0']
        ? Number(totalExpendedUsd['0'])
        : 0;
    } catch (e) {
      console.log('getTotalExpendedUsd Infura error:', e);

      return 0;
    }
  };

  /**
   *
   * @param donationNumber Overall donation number, i.e. out of total donations
   */
  public getDonationTracker = async (
    donationNumber: number
  ): Promise<IDonationTrackerItem | null> => {
    try {
      const donationTracker = await this.callStandardCharityContract(
        'donationTracker',
        0,
        [donationNumber]
      );

      if (!donationTracker || !donationTracker['0']) {
        return null;
      }

      const [addressDonationNum, address] = donationTracker['0'].split('-');

      if (!addressDonationNum || !address) {
        return null;
      }

      return {
        overallDonationNum: donationNumber,
        addressDonationNum: Number(addressDonationNum),
        address: `0x${address}`,
      };
    } catch (e) {
      console.log('getDonationTracker Infura error:', e);

      return null;
    }
  };

  /**
   *
   * @param address Address of the donator
   * @param addressDonationNum Donation number as it relates to the donator's address, not overall
   */
  public getDonation = async (
    address: string,
    addressDonationNum: number
  ): Promise<IDonation | null> => {
    try {
      const donation = (await this.callStandardCharityContract('donations', 0, [
        address,
        addressDonationNum,
      ])) as IDonation;

      if (
        !donation ||
        !donation.donator ||
        !donation.value ||
        !donation.timestamp ||
        !donation.valueExpendedETH ||
        !donation.valueExpendedUSD ||
        !donation.valueRefundedETH ||
        !donation.donationNumber ||
        !donation.numExpenditures
      ) {
        return null;
      }

      return {
        donator: donation.donator,
        value: donation.value,
        timestamp: donation.timestamp,
        valueExpendedETH: donation.valueExpendedETH,
        valueExpendedUSD: donation.valueExpendedUSD,
        valueRefundedETH: donation.valueRefundedETH,
        donationNumber: donation.donationNumber,
        numExpenditures: donation.numExpenditures,
      };
    } catch (e) {
      console.log('getDonation Infura error:', e);

      return null;
    }
  };

  public getExpenditure = async (
    expenditureNumber: number
  ): Promise<IExpenditure | null> => {
    try {
      const expenditure = (await this.callStandardCharityContract(
        'expenditures',
        0,
        [expenditureNumber]
      )) as IExpenditure;

      if (
        !expenditure ||
        !expenditure.valueExpendedETH ||
        !expenditure.valueExpendedUSD ||
        !expenditure.videoHash ||
        !expenditure.receiptHash ||
        !expenditure.timestamp ||
        !expenditure.numExpendedDonations ||
        !expenditure.valueExpendedByDonations ||
        !expenditure.platesDeployed
      ) {
        return null;
      }

      return {
        expenditureNumber,
        valueExpendedETH: expenditure.valueExpendedETH,
        valueExpendedUSD: expenditure.valueExpendedUSD,
        videoHash: expenditure.videoHash,
        receiptHash: expenditure.receiptHash,
        timestamp: expenditure.timestamp,
        numExpendedDonations: expenditure.numExpendedDonations,
        valueExpendedByDonations: expenditure.valueExpendedByDonations,
        platesDeployed: expenditure.platesDeployed,
      };
    } catch (e) {
      console.log('getExpenditure Infura error:', e);

      return null;
    }
  };

  public getExpendedDonation = async (
    expendedDonationNumber: number
  ): Promise<IExpendedDonation | null> => {
    try {
      const expendedDonation = (await this.callStandardCharityContract(
        'expendedDonations',
        0,
        [expendedDonationNumber]
      )) as IExpendedDonation;

      if (
        !expendedDonation ||
        !expendedDonation.donator ||
        !expendedDonation.valueExpendedETH ||
        !expendedDonation.valueExpendedUSD ||
        !expendedDonation.expenditureNumber ||
        !expendedDonation.donationNumber ||
        !expendedDonation.platesDeployed
      ) {
        return null;
      }

      return {
        expendedDonationNumber,
        donator: expendedDonation.donator,
        valueExpendedETH: expendedDonation.valueExpendedETH,
        valueExpendedUSD: expendedDonation.valueExpendedUSD,
        expenditureNumber: expendedDonation.expenditureNumber,
        donationNumber: expendedDonation.donationNumber,
        platesDeployed: expendedDonation.platesDeployed,
      };
    } catch (e) {
      console.log('getExpendedDonation Infura error:', e);

      return null;
    }
  };

  /**
   *
   * @param address Address of the donator
   * @param donationNumber Donation number as it relates to the donator's address, not overall
   * @param valueETHToRefund denominated in wei
   */
  public refundDonation = async (
    address: string,
    donationNumber: number,
    valueETHToRefund: BN
  ): Promise<boolean> => {
    try {
      const refundRes = await this.sendRawTransaction('refundDonation', [
        address,
        donationNumber,
        valueETHToRefund.toString(),
      ]);

      if (refundRes && refundRes.__length__ === 0) {
        return true;
      }

      return false;
    } catch (e) {
      console.log('refundDonation Infura error:', e);

      return false;
    }
  };

  /**
   *
   * @param videoHash The xxHash of the video
   * @param receiptHash The xxHash of the receipt
   * @param valueUSD Denominated in cents
   * @param valueETH Denominated in wei
   */
  public createExpenditure = async (
    videoHash: string,
    receiptHash: string,
    valueUSD: number,
    valueETH: BN
  ): Promise<boolean> => {
    try {
      const createExpenditureRes = await this.sendRawTransaction(
        'createExpenditure',
        [videoHash, receiptHash, valueUSD.toString(), valueETH.toString()]
      );

      if (createExpenditureRes && createExpenditureRes.__length__ === 0) {
        return true;
      }

      return false;
    } catch (e) {
      console.log('createExpenditure in Infura error:', e);

      return false;
    }
  };

  /**
   *
   * @param donator Address of the wallet that donated
   * @param valueExpendedETH Denominated in wei
   * @param valueExpendedUSD Denominated in cents
   * @param donationNumber Donation number as it relates to the donator's address, not overall
   * @param expenditureNumber Overall expenditure number
   */
  public createExpendedDonation = async (
    donator: string,
    valueExpendedETH: BN,
    valueExpendedUSD: number,
    donationNumber: number,
    expenditureNumber: number
  ): Promise<boolean> => {
    try {
      const createExpendedDonationRes = await this.sendRawTransaction(
        'createExpendedDonation',
        [
          donator,
          valueExpendedETH.toString(),
          valueExpendedUSD.toString(),
          donationNumber,
          expenditureNumber,
        ]
      );

      console.log('createExpendedDonationRes:', createExpendedDonationRes);

      if (
        createExpendedDonationRes &&
        createExpendedDonationRes.__length__ === 0
      ) {
        return true;
      }

      return false;
    } catch (e) {
      console.log('createExpendedDonation in Infura error:', e);

      return false;
    }
  };

  /**
   *
   * @param nextDonationToExpend Donations are chronological, so increment as needed
   */
  public setNextDonationToExpend = async (
    nextDonationToExpend: number
  ): Promise<boolean> => {
    try {
      const setNextDonationToExpendRes = await this.sendRawTransaction(
        'setNextDonationToExpend',
        [nextDonationToExpend]
      );

      console.log('setNextDonationToExpendRes:', setNextDonationToExpendRes);

      return true;
    } catch (e) {
      console.log('setNextDonationToExpend in Inufra error:', e);

      return false;
    }
  };
}

export default StandardCharityContractFunctions;
