import Web3 from 'web3';
import BN from 'bn.js';

import { redisClient, setValue, getValue } from './instance';
import Infura from '../Infura';
import { ISpotlightDonation } from '../types';

enum RedisKeys {
  TOTAL_NUM_DONATIONS = 'totalNumDonations',
  TOTAL_NUM_EXPENDITURES = 'totalNumExpenditures',
  TOTAL_NUM_EXPENDED_DONATIONS = 'totalNumExpendedDonations',
  STANDARD_CHARITY_CONTRACT_BALANCE = 'standardCharityContractBalance',
  MAX_DONATION = 'maxDonation',
  LATEST_DONATION = 'latestDonation',
  NEXT_DONATION_TO_EXPEND = 'nextDonationToExpend',
  TOTAL_DONATIONS_ETH = 'totalDonationsEth',
  TOTAL_EXPENDED_ETH = 'totalExpendedEth',
  TOTAL_EXPENDED_USD = 'totalExpendedUsd',
  ALL_DONATIONS = 'allDonations',
}

class Redis {
  infura: Infura;
  web3: Web3;

  constructor() {
    this.infura = new Infura();

    this.web3 = new Web3();
  }

  public fillCache = async (): Promise<void> => {
    try {
      await this.flushCache();

      await this.setTotalNumDonations();

      await this.setTotalNumExpenditures();

      await this.setStandardCharityContractBalance();

      await this.setMaxDonation();

      await this.setLatestDonation();

      await this.setNextDonationToExpend();

      await this.setTotalDonationsEth();

      await this.setTotalExpendedEth();

      await this.setTotalExpendedUsd();

      console.log('redis cache created');
    } catch (e) {
      console.log('Catch error in fillCache:', e);
    }
  };

  private flushCache = async (): Promise<void> => {
    try {
      return new Promise((resolve) => {
        redisClient.flushall('ASYNC', (message) => {
          if (message) {
            console.log('flushCache message:', message);
          }

          resolve();
        });
      });
    } catch (e) {
      console.log('Catch error in flushCache:', e);

      return;
    }
  };

  setTotalNumDonations = async (): Promise<void> => {
    try {
      const totalNumDonations = await this.infura.getTotalNumDonations();

      await setValue(
        RedisKeys.TOTAL_NUM_DONATIONS,
        totalNumDonations.toString()
      );
    } catch (e) {
      console.log('setTotalNumDonations redis error:', e);
    }
  };

  getTotalNumDonations = async (): Promise<number> => {
    try {
      const totalNumDonations = await getValue(RedisKeys.TOTAL_NUM_DONATIONS);

      return totalNumDonations ? Number(totalNumDonations) : 0;
    } catch (e) {
      console.log('getTotalNumDonations redis error:', e);

      return 0;
    }
  };

  setTotalNumExpenditures = async (): Promise<void> => {
    try {
      const totalNumExpenditures = await this.infura.getTotalNumExpenditures();

      await setValue(
        RedisKeys.TOTAL_NUM_EXPENDITURES,
        totalNumExpenditures.toString()
      );
    } catch (e) {
      console.log('setTotalNumExpenditures redis error:', e);
    }
  };

  getTotalNumExpenditures = async (): Promise<number> => {
    try {
      const totalNumExpenditures = await getValue(
        RedisKeys.TOTAL_NUM_EXPENDITURES
      );

      return totalNumExpenditures ? Number(totalNumExpenditures) : 0;
    } catch (e) {
      console.log('getTotalNumExpenditures redis error:', e);

      return 0;
    }
  };

  setTotalNumExpendedDonations = async (): Promise<void> => {
    try {
      const totalNumExpendedDonations = await this.infura.getTotalNumExpendedDonations();

      await setValue(
        RedisKeys.TOTAL_NUM_EXPENDED_DONATIONS,
        totalNumExpendedDonations.toString()
      );
    } catch (e) {
      console.log('setTotalNumExpendedDonations redis error:', e);
    }
  };

  getTotalNumExpendedDonations = async (): Promise<number> => {
    try {
      const totalNumExpendedDonations = await getValue(
        RedisKeys.TOTAL_NUM_EXPENDED_DONATIONS
      );

      return totalNumExpendedDonations ? Number(totalNumExpendedDonations) : 0;
    } catch (e) {
      console.log('getTotalNumExpenditures redis error:', e);

      return 0;
    }
  };

  setStandardCharityContractBalance = async (): Promise<void> => {
    try {
      const contractBalance = await this.infura.getStandardCharityContractBalance();

      await setValue(
        RedisKeys.STANDARD_CHARITY_CONTRACT_BALANCE,
        contractBalance
      );
    } catch (e) {
      console.log('setStandardCharityContractBalance redis error:', e);
    }
  };

  getStandardCharityContractBalance = async (): Promise<BN> => {
    try {
      const contractBalance = await getValue(
        RedisKeys.STANDARD_CHARITY_CONTRACT_BALANCE
      );

      return contractBalance
        ? this.web3.utils.toBN(contractBalance)
        : this.web3.utils.toBN(0);
    } catch (e) {
      console.log('getStandardCharityContractBalance redis error:', e);

      return this.web3.utils.toBN(0);
    }
  };

  setMaxDonation = async (): Promise<void> => {
    try {
      const maxDonation = await this.infura.getMaxDonation();

      if (!maxDonation) {
        return;
      }

      await setValue(RedisKeys.MAX_DONATION, JSON.stringify(maxDonation));
    } catch (e) {
      console.log('setMaxDonation redis error:', e);
    }
  };

  getMaxDonation = async (): Promise<ISpotlightDonation | null> => {
    try {
      const maxDonation = await getValue(RedisKeys.MAX_DONATION);

      if (!maxDonation) {
        return null;
      }

      const parsed = JSON.parse(maxDonation);

      return {
        donator: parsed.donator,
        value: this.web3.utils.toBN(parsed.value),
        timestamp: Number(parsed.timestamp),
      };
    } catch (e) {
      console.log('getMaxDonation redis error:', e);

      return null;
    }
  };

  setLatestDonation = async (): Promise<void> => {
    try {
      const latestDonation = await this.infura.getLatestDonation();

      if (!latestDonation) {
        return;
      }

      await setValue(RedisKeys.LATEST_DONATION, JSON.stringify(latestDonation));
    } catch (e) {
      console.log('setLatestDonation redis error:', e);
    }
  };

  getLatestDonation = async (): Promise<ISpotlightDonation | null> => {
    try {
      const latestDonation = await getValue(RedisKeys.LATEST_DONATION);

      if (!latestDonation) {
        return null;
      }

      const parsed = JSON.parse(latestDonation);

      return {
        donator: parsed.donator,
        value: this.web3.utils.toBN(parsed.value),
        timestamp: Number(parsed.timestamp),
      };
    } catch (e) {
      console.log('getLatestDonation redis error:', e);

      return null;
    }
  };

  setNextDonationToExpend = async (): Promise<void> => {
    try {
      const nextDonationToExpend = await this.infura.getNextDonationToExpend();

      if (!nextDonationToExpend) {
        return;
      }

      await setValue(
        RedisKeys.NEXT_DONATION_TO_EXPEND,
        nextDonationToExpend.toString()
      );
    } catch (e) {
      console.log('setNextDonationToExpend redis error:', e);
    }
  };

  getNextDonationToExpend = async (): Promise<number | null> => {
    try {
      const nextDonationToExpend = await getValue(
        RedisKeys.NEXT_DONATION_TO_EXPEND
      );

      return nextDonationToExpend ? Number(nextDonationToExpend) : null;
    } catch (e) {
      console.log('getTotalNumExpenditures redis error:', e);

      return null;
    }
  };

  setTotalDonationsEth = async (): Promise<void> => {
    try {
      const totalDonationsEth = await this.infura.getTotalDonationsEth();

      await setValue(
        RedisKeys.TOTAL_DONATIONS_ETH,
        totalDonationsEth ? totalDonationsEth.toString() : '0'
      );
    } catch (e) {
      console.log('setTotalDonationsEth redis error:', e);
    }
  };

  getTotalDonationsEth = async (): Promise<BN> => {
    try {
      const totalDonationsEth = await getValue(RedisKeys.TOTAL_DONATIONS_ETH);

      return totalDonationsEth
        ? this.web3.utils.toBN(totalDonationsEth)
        : this.web3.utils.toBN(0);
    } catch (e) {
      console.log('getTotalDonationsEth redis error:', e);

      return this.web3.utils.toBN(0);
    }
  };

  setTotalExpendedEth = async (): Promise<void> => {
    try {
      const totalExpendedEth = await this.infura.getTotalExpendedEth();

      await setValue(
        RedisKeys.TOTAL_EXPENDED_ETH,
        totalExpendedEth ? totalExpendedEth.toString() : '0'
      );
    } catch (e) {
      console.log('setTotalExpendedEth redis error:', e);
    }
  };

  getTotalExpendedEth = async (): Promise<BN> => {
    try {
      const totalExpendedEth = await getValue(RedisKeys.TOTAL_EXPENDED_ETH);

      return totalExpendedEth
        ? this.web3.utils.toBN(totalExpendedEth)
        : this.web3.utils.toBN(0);
    } catch (e) {
      console.log('getTotalExpendedEth redis error:', e);

      return this.web3.utils.toBN(0);
    }
  };

  setTotalExpendedUsd = async (): Promise<void> => {
    try {
      const totalExpendedUsd = await this.infura.getTotalExpendedUsd();

      await setValue(
        RedisKeys.TOTAL_EXPENDED_USD,
        totalExpendedUsd ? totalExpendedUsd.toString() : '0'
      );
    } catch (e) {
      console.log('setTotalExpendedUsd redis error:', e);
    }
  };

  getTotalExpendedUsd = async (): Promise<number> => {
    try {
      const totalExpendedUsd = await getValue(RedisKeys.TOTAL_EXPENDED_USD);

      return totalExpendedUsd ? Number(totalExpendedUsd) : 0;
    } catch (e) {
      console.log('getTotalExpendedUsd redis error:', e);

      return 0;
    }
  };

  /**
   * TO DO:
   * - donationTracker
   * - all donations
   * - expenditures
   * - numDonationsByUser
   */
}

export default Redis;
