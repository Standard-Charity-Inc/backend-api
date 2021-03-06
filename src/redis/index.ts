import Web3 from 'web3';
import { uniqWith, uniqBy } from 'lodash';
import BN from 'bn.js';

import { redisClient, setValue, getValue, lpush, readLrange } from './instance';
import Infura from '../Infura';
import {
  ISpotlightDonation,
  IDonationTrackerItem,
  IDonation,
  IExpenditure,
  IExpendedDonation,
  IPendingExpendedDonation,
  IPendingRefund,
} from '../types';
import { numPlatesToFloating } from '../utils';

export enum RedisKeys {
  TOTAL_NUM_DONATIONS = 'totalNumDonations',
  TOTAL_NUM_EXPENDITURES = 'totalNumExpenditures',
  TOTAL_NUM_EXPENDED_DONATIONS = 'totalNumExpendedDonations',
  TOTAL_PLATES_DEPLOYED = 'totalPlatesDeployed',
  STANDARD_CHARITY_CONTRACT_BALANCE = 'standardCharityContractBalance',
  MAX_DONATION = 'maxDonation',
  LATEST_DONATION = 'latestDonation',
  NEXT_DONATION_TO_EXPEND = 'nextDonationToExpend',
  TOTAL_DONATIONS_ETH = 'totalDonationsEth',
  TOTAL_EXPENDED_ETH = 'totalExpendedEth',
  TOTAL_EXPENDED_USD = 'totalExpendedUsd',
  DONATION_TRACKER_ITEMS = 'donationTrackerItems',
  ALL_DONATIONS = 'allDonations',
  ALL_EXPENDITURES = 'allExpenditures',
  ALL_EXPENDED_DONATIONS = 'allExpendedDonations',
  IS_CREATING_EXPENDITURE = 'isCreatingExpenditure',
  PENDING_EXPENDED_DONATIONS = 'pendingExpendedDonations',
  PENDING_NEXT_DONATION_TO_EXPEND = 'pendingNextDonationToExpend',
  IS_CREATING_REFUNDS = 'isCreatingRefunds',
  PENDING_REFUNDS = 'pendingRefunds',
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

      await this.setIsCreatingExpenditure(false);

      await this.setTotalNumDonations();

      await this.setTotalNumExpenditures();

      await this.setTotalPlatesDeployed();

      await this.setStandardCharityContractBalance();

      await this.setMaxDonation();

      await this.setLatestDonation();

      await this.setNextDonationToExpend();

      await this.setTotalDonationsEth();

      await this.setTotalExpendedEth();

      await this.setTotalExpendedUsd();

      await this.setDonationTrackerItems();

      await this.setAllDonations();

      await this.setAllExpenditures();

      await this.setTotalNumExpendedDonations();

      await this.setAllExpendedDonations();

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

  setPendingNextDonationToExpend = async (
    nextDonationToExpend: number
  ): Promise<void> => {
    try {
      await setValue(
        RedisKeys.PENDING_NEXT_DONATION_TO_EXPEND,
        nextDonationToExpend.toString()
      );
    } catch (e) {
      console.log('Catch error in setPendingNextDonationToExpend in redis:', e);
    }
  };

  getPendingNextDonationToExpend = async (): Promise<number | null> => {
    try {
      const pendingNextDonationToExpend = await getValue(
        RedisKeys.PENDING_NEXT_DONATION_TO_EXPEND
      );

      if (!pendingNextDonationToExpend) {
        return null;
      }

      return Number(pendingNextDonationToExpend);
    } catch (e) {
      console.log('Catch error in getPendingNextDonationToExpend in redis:', e);

      return null;
    }
  };

  setIsCreatingExpenditure = async (isCreating: boolean): Promise<void> => {
    try {
      await setValue(RedisKeys.IS_CREATING_EXPENDITURE, `${isCreating}`);
    } catch (e) {
      console.log('Catch error in setIsCreatingExpenditure in redis:', e);
    }
  };

  getIsCreatingExpenditure = async (): Promise<boolean> => {
    try {
      const isCreatingPendingDonations = await getValue(
        RedisKeys.IS_CREATING_EXPENDITURE
      );

      return isCreatingPendingDonations === 'true';
    } catch (e) {
      console.log('Catch error in getIsCreatingExpenditure in redis:', e);

      return false;
    }
  };

  setIsCreatingRefunds = async (isCreating: boolean): Promise<void> => {
    try {
      await setValue(RedisKeys.IS_CREATING_REFUNDS, `${isCreating}`);
    } catch (e) {
      console.log('Catch error in setIsCreatingRefunds in redis:', e);
    }
  };

  getIsCreatingRefunds = async (): Promise<boolean> => {
    try {
      const isCreatingRefunds = await getValue(RedisKeys.IS_CREATING_REFUNDS);

      return isCreatingRefunds === 'true';
    } catch (e) {
      console.log('Catch error in getIsCreatingRefunds in redis:', e);

      return false;
    }
  };

  pushToPendingRefunds = async (
    pendingRefund: string | string[]
  ): Promise<void> => {
    try {
      if (Array.isArray(pendingRefund) && pendingRefund.length === 0) {
        return;
      }

      await lpush(
        RedisKeys.PENDING_REFUNDS,
        Array.isArray(pendingRefund) ? pendingRefund : [pendingRefund]
      );
    } catch (e) {
      console.log('pushToPendingRefunds error in redis:', e);
    }
  };

  getAllPendingRefunds = async (): Promise<IPendingRefund[]> => {
    try {
      const pendingRefunds = await readLrange(RedisKeys.PENDING_REFUNDS, 0, -1);

      let allPendingRefunds: IPendingRefund[] = [];

      if (pendingRefunds) {
        allPendingRefunds = pendingRefunds.map((x) => {
          const pendingRefund = JSON.parse(x);

          return {
            address: pendingRefund.address,
            donationNumber: Number(pendingRefund.donationNumber),
            valueETHToRefund: pendingRefund.valueETHToRefund,
          };
        });
      }

      return uniqWith(
        allPendingRefunds,
        (a, b) =>
          a.donationNumber === b.donationNumber &&
          a.address.toLowerCase() === b.address.toLowerCase()
      );
    } catch (e) {
      console.log('getAllPendingRefunds redis error:', e);

      return [];
    }
  };

  pushToPendingExpendedDonations = async (
    pendingDonation: string | string[]
  ): Promise<void> => {
    try {
      if (Array.isArray(pendingDonation) && pendingDonation.length === 0) {
        return;
      }

      await lpush(
        RedisKeys.PENDING_EXPENDED_DONATIONS,
        Array.isArray(pendingDonation) ? pendingDonation : [pendingDonation]
      );
    } catch (e) {
      console.log('pushToPendingExpendedDonations error in redis:', e);
    }
  };

  getAllPendingExpendedDonations = async (): Promise<
    IPendingExpendedDonation[]
  > => {
    try {
      const pendingExpendedDonations = await readLrange(
        RedisKeys.PENDING_EXPENDED_DONATIONS,
        0,
        -1
      );

      let allPendingExpendedDonations: IPendingExpendedDonation[] = [];

      if (pendingExpendedDonations) {
        allPendingExpendedDonations = pendingExpendedDonations.map((x) => {
          const pendingExpendedDonation = JSON.parse(x);

          return {
            donator: pendingExpendedDonation.donator,
            valueExpendedETH: new BN(pendingExpendedDonation.valueExpendedETH),
            valueExpendedUSD: Number(pendingExpendedDonation.valueExpendedUSD),
            donationNumber: Number(pendingExpendedDonation.donationNumber),
            expenditureNumber: Number(
              pendingExpendedDonation.expenditureNumber
            ),
            platesDeployed: Number(pendingExpendedDonation.platesDeployed),
          };
        });
      }

      return uniqWith(
        allPendingExpendedDonations,
        (a, b) =>
          a.donationNumber === b.donationNumber &&
          a.donator.toLowerCase() === b.donator.toLowerCase()
      );
    } catch (e) {
      console.log('getAllPendingExpendedDonations redis error:', e);

      return [];
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

  setTotalPlatesDeployed = async (): Promise<void> => {
    try {
      const totalPlatesDeployed = await this.infura.getTotalPlatesDeployed();

      await setValue(
        RedisKeys.TOTAL_PLATES_DEPLOYED,
        numPlatesToFloating(totalPlatesDeployed).toString()
      );
    } catch (e) {
      console.log('setTotalPlatesDeployed redis error:', e);
    }
  };

  getTotalPlatesDeployed = async (): Promise<number> => {
    try {
      const totalPlatesDeployed = await getValue(
        RedisKeys.TOTAL_PLATES_DEPLOYED
      );

      return totalPlatesDeployed ? Number(totalPlatesDeployed) : 0;
    } catch (e) {
      console.log('getTotalPlatesDeployed redis error:', e);

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

  getStandardCharityContractBalance = async (): Promise<string> => {
    try {
      const contractBalance = await getValue(
        RedisKeys.STANDARD_CHARITY_CONTRACT_BALANCE
      );

      return contractBalance || '0';
    } catch (e) {
      console.log('getStandardCharityContractBalance redis error:', e);

      return '0';
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
        value: parsed.value,
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
        value: parsed.value,
        timestamp: Number(parsed.timestamp),
      };
    } catch (e) {
      console.log('getLatestDonation redis error:', e);

      return null;
    }
  };

  setNextDonationToExpend = async (nextToExpend?: number): Promise<void> => {
    try {
      const nextDonationToExpend =
        nextToExpend || (await this.infura.getNextDonationToExpend());

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

  getTotalDonationsEth = async (): Promise<string> => {
    try {
      const totalDonationsEth = await getValue(RedisKeys.TOTAL_DONATIONS_ETH);

      return totalDonationsEth || '0';
    } catch (e) {
      console.log('getTotalDonationsEth redis error:', e);

      return '0';
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

  getTotalExpendedEth = async (): Promise<string> => {
    try {
      const totalExpendedEth = await getValue(RedisKeys.TOTAL_EXPENDED_ETH);

      return totalExpendedEth || '0';
    } catch (e) {
      console.log('getTotalExpendedEth redis error:', e);

      return '0';
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

  setDonationTrackerItems = async (): Promise<void> => {
    try {
      const totalNumDonations = await this.getTotalNumDonations();

      await Promise.all(
        [...Array(totalNumDonations)].map(async (_, i) => {
          const donationTrackerItem = await this.infura.getDonationTracker(
            i + 1
          );

          if (!donationTrackerItem) {
            return;
          }

          await this.pushDonationTrackerItem(
            JSON.stringify(donationTrackerItem)
          );
        })
      );
    } catch (e) {
      console.log('setDonationTracker redis error:', e);
    }
  };

  pushDonationTrackerItem = async (
    donationTrackerItem: string
  ): Promise<void> => {
    try {
      await lpush(RedisKeys.DONATION_TRACKER_ITEMS, [donationTrackerItem]);
    } catch (e) {
      console.log('pushDonationTrackerItem error in redis:', e);
    }
  };

  getDonationTrackerItems = async (): Promise<IDonationTrackerItem[]> => {
    try {
      const donationTrackerItems = await readLrange(
        RedisKeys.DONATION_TRACKER_ITEMS,
        0,
        -1
      );

      let allDonationTrackerItems: IDonationTrackerItem[] = [];

      if (donationTrackerItems) {
        allDonationTrackerItems = donationTrackerItems.map((x) =>
          JSON.parse(x)
        );
      }

      return donationTrackerItems
        ? donationTrackerItems.map((x) => JSON.parse(x))
        : [];
    } catch (e) {
      console.log('getDonationTrackerItems redis error:', e);

      return [];
    }
  };

  setAllDonations = async (): Promise<void> => {
    try {
      const donationTrackerItems = await this.getDonationTrackerItems();

      await Promise.all(
        donationTrackerItems.map(async (item) => {
          const donation = await this.infura.getDonation(
            item.address,
            item.addressDonationNum
          );

          if (!donation) {
            return;
          }

          await this.pushDonation(JSON.stringify(donation));
        })
      );
    } catch (e) {
      console.log('setDonationTracker redis error:', e);
    }
  };

  pushDonation = async (donation: string | string[]): Promise<void> => {
    try {
      if (Array.isArray(donation) && donation.length === 0) {
        return;
      }

      await lpush(
        RedisKeys.ALL_DONATIONS,
        Array.isArray(donation) ? donation : [donation]
      );
    } catch (e) {
      console.log('pushDonation error in redis:', e);
    }
  };

  getAllDonations = async (): Promise<IDonation[]> => {
    try {
      const donations = await readLrange(RedisKeys.ALL_DONATIONS, 0, -1);

      let allDonations: IDonation[] = [];

      if (donations) {
        allDonations = donations.map((x) => {
          const donation = JSON.parse(x);

          return {
            donator: donation.donator,
            value: donation.value,
            timestamp: Number(donation.timestamp),
            valueExpendedETH: donation.valueExpendedETH,
            valueExpendedUSD: Number(donation.valueExpendedUSD),
            valueRefundedETH: donation.valueRefundedETH,
            donationNumber: Number(donation.donationNumber),
            numExpenditures: Number(donation.numExpenditures),
          };
        });
      }

      return uniqWith(
        allDonations,
        (a, b) =>
          a.donationNumber === b.donationNumber &&
          a.donator.toLowerCase() === b.donator.toLowerCase()
      );
    } catch (e) {
      console.log('getAllDonations redis error:', e);

      return [];
    }
  };

  setAllExpenditures = async (): Promise<void> => {
    try {
      const totalNumExpenditures = await this.getTotalNumExpenditures();

      await Promise.all(
        [...Array(totalNumExpenditures)].map(async (_, i) => {
          const expenditure = await this.infura.getExpenditure(i + 1);

          if (!expenditure) {
            console.log('Could not get expenditure');

            return;
          }

          await this.pushExpenditure(JSON.stringify(expenditure));
        })
      );
    } catch (e) {
      console.log('setAllExpenditures redis error:', e);
    }
  };

  pushExpenditure = async (expenditure: string): Promise<void> => {
    try {
      await lpush(RedisKeys.ALL_EXPENDITURES, [expenditure]);
    } catch (e) {
      console.log('pushExpenditure error in redis:', e);
    }
  };

  getAllExpenditures = async (): Promise<IExpenditure[]> => {
    try {
      const expenditures = await readLrange(RedisKeys.ALL_EXPENDITURES, 0, -1);

      let allExpenditures: IExpenditure[] = [];

      if (expenditures) {
        allExpenditures = expenditures.map((x) => {
          const expenditure = JSON.parse(x);

          return {
            expenditureNumber: Number(expenditure.expenditureNumber),
            valueExpendedETH: expenditure.valueExpendedETH,
            valueExpendedUSD: Number(expenditure.valueExpendedUSD),
            videoHash: expenditure.videoHash,
            receiptHash: expenditure.receiptHash,
            timestamp: Number(expenditure.timestamp),
            numExpendedDonations: Number(expenditure.numExpendedDonations),
            valueExpendedByDonations: expenditure.valueExpendedByDonations,
            platesDeployed: numPlatesToFloating(expenditure.platesDeployed),
          };
        });
      }

      return uniqBy(allExpenditures, (o) => o.expenditureNumber);
    } catch (e) {
      console.log('getAllDonations redis error:', e);

      return [];
    }
  };

  setAllExpendedDonations = async (): Promise<void> => {
    try {
      const totalNumExpendedDonations = await this.getTotalNumExpendedDonations();

      await Promise.all(
        [...Array(totalNumExpendedDonations)].map(async (_, i) => {
          const expendedDonation = await this.infura.getExpendedDonation(i + 1);

          if (!expendedDonation) {
            return;
          }

          await this.pushExpendedDonation(JSON.stringify(expendedDonation));
        })
      );
    } catch (e) {
      console.log('setDonationTracker redis error:', e);
    }
  };

  pushExpendedDonation = async (expendedDonation: string): Promise<void> => {
    try {
      await lpush(RedisKeys.ALL_EXPENDED_DONATIONS, [expendedDonation]);
    } catch (e) {
      console.log('pushExpendedDonation error in redis:', e);
    }
  };

  getAllExpendedDonations = async (): Promise<IExpendedDonation[]> => {
    try {
      const expendedDonations = await readLrange(
        RedisKeys.ALL_EXPENDED_DONATIONS,
        0,
        -1
      );

      let allExpendedDonations: IExpendedDonation[] = [];

      if (expendedDonations) {
        allExpendedDonations = expendedDonations.map((x) => {
          const expendedDonation = JSON.parse(x);

          return {
            expendedDonationNumber: Number(
              expendedDonation.expendedDonationNumber
            ),
            donator: expendedDonation.donator,
            valueExpendedETH: expendedDonation.valueExpendedETH,
            valueExpendedUSD: Number(expendedDonation.valueExpendedUSD),
            expenditureNumber: Number(expendedDonation.expenditureNumber),
            donationNumber: Number(expendedDonation.donationNumber),
            platesDeployed: numPlatesToFloating(
              expendedDonation.platesDeployed
            ),
          };
        });
      }

      return uniqBy(allExpendedDonations, (o) => o.expendedDonationNumber);
    } catch (e) {
      console.log('getAllExpendedDonations redis error:', e);

      return [];
    }
  };
}

export default Redis;
