import {
  IDonation,
  IDonationTrackerItem,
  IExpenditure,
  IExpendedDonation,
  IPendingExpendedDonation,
  IPendingRefund,
} from '../../types';
import Infura from '..';
import { deleteKey } from '../../redis/instance';
import Redis, { RedisKeys } from '../../redis';

class Helpers {
  infura: Infura;
  redis: Redis;
  numRetries: number;

  constructor() {
    this.infura = new Infura();

    this.redis = new Redis();

    this.numRetries = 10;
  }

  getDonation = async (
    donator: string,
    donationNumber: number
  ): Promise<IDonation | null> => {
    try {
      const donation = await this.infura.getDonation(donator, donationNumber);

      if (!donation) {
        return null;
      }

      if (donation.value === '0') {
        if (this.numRetries > 0) {
          console.log('Retry in donations');

          this.numRetries -= 1;

          await this.sleep();

          return await this.getDonation(donator, donationNumber);
        } else {
          console.log(
            'Ran out of retries in getDonation for Helpers:',
            donator,
            donationNumber
          );

          return null;
        }
      }

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
    } catch (e) {
      console.log('Error in getDonation in Helpers:', e);

      return null;
    }
  };

  getDonationTracker = async (
    overallDonationNumber: number
  ): Promise<IDonationTrackerItem | null> => {
    try {
      const donationTrackerItem = await this.infura.getDonationTracker(
        overallDonationNumber
      );

      if (!donationTrackerItem) {
        if (this.numRetries > 0) {
          console.log('Retry in getDonationTracker');
          this.numRetries -= 1;

          await this.sleep();

          return await this.getDonationTracker(overallDonationNumber);
        } else {
          console.log(
            'Ran out of retries in getDonationTracker for Helpers:',
            overallDonationNumber
          );
        }

        return null;
      }

      return {
        overallDonationNum: overallDonationNumber,
        addressDonationNum: Number(donationTrackerItem.addressDonationNum),
        address: donationTrackerItem.address,
      };
    } catch (e) {
      console.log('Error in getDonationTracker in Helpers:', e);

      return null;
    }
  };

  getExpenditure = async (
    expenditureNumber: number
  ): Promise<IExpenditure | null> => {
    try {
      const expenditure = await this.infura.getExpenditure(expenditureNumber);

      if (!expenditure) {
        if (this.numRetries > 0) {
          console.log('Retry in getExpenditure');

          this.numRetries -= 1;

          await this.sleep();

          return await this.getExpenditure(expenditureNumber);
        } else {
          console.log(
            'Ran out of retries in getExpenditure for Helpers:',
            expenditureNumber
          );

          return null;
        }
      }

      return {
        expenditureNumber: Number(expenditure.expenditureNumber),
        valueExpendedETH: expenditure.valueExpendedETH,
        valueExpendedUSD: Number(expenditure.valueExpendedUSD),
        videoHash: expenditure.videoHash,
        receiptHash: expenditure.receiptHash,
        timestamp: Number(expenditure.timestamp),
        numExpendedDonations: Number(expenditure.numExpendedDonations),
        valueExpendedByDonations: expenditure.valueExpendedByDonations,
        platesDeployed: Number(expenditure.platesDeployed),
      };
    } catch (e) {
      console.log('Error in getExpenditure in Helpers:', e);

      return null;
    }
  };

  getExpendedDonation = async (
    expendedDonationNumber: number
  ): Promise<IExpendedDonation | null> => {
    try {
      const expendedDonation = await this.infura.getExpendedDonation(
        expendedDonationNumber
      );

      if (
        !expendedDonation ||
        (expendedDonation && expendedDonation.valueExpendedETH === '0')
      ) {
        if (this.numRetries > 0) {
          console.log('Retry in getExpendedDonation');

          this.numRetries -= 1;

          await this.sleep();

          return await this.getExpendedDonation(expendedDonationNumber);
        } else {
          console.log(
            'Ran out of retries in getExpendedDonation for Helpers:',
            expendedDonationNumber
          );

          return null;
        }
      }

      return {
        expendedDonationNumber: Number(expendedDonation.expendedDonationNumber),
        donator: expendedDonation.donator,
        valueExpendedETH: expendedDonation.valueExpendedETH,
        valueExpendedUSD: Number(expendedDonation.valueExpendedUSD),
        expenditureNumber: Number(expendedDonation.expenditureNumber),
        donationNumber: Number(expendedDonation.donationNumber),
        platesDeployed: expendedDonation.platesDeployed,
      };
    } catch (e) {
      console.log('Error in getExpenditure in Helpers:', e);

      return null;
    }
  };

  createExpendedDonation = async (
    args: IPendingExpendedDonation
  ): Promise<boolean> => {
    try {
      const createExpendedDonationRes = await this.infura.createExpendedDonation(
        args
      );

      if (!createExpendedDonationRes) {
        if (this.numRetries > 0) {
          console.log('Retry in createExpendedDonation');

          this.numRetries -= 1;

          await this.sleep();

          return await this.createExpendedDonation(args);
        } else {
          console.log(
            'Ran out of retries in createExpendedDonation for Helpers:',
            args
          );
        }
      }

      await this.deletePendingExpendedDonation(
        args.donator,
        Number(args.donationNumber)
      );

      return true;
    } catch (e) {
      console.log('Error in createExpendedDonation in Helpers:', e);

      await this.deletePendingExpendedDonation(
        args.donator,
        Number(args.donationNumber)
      );

      return false;
    }
  };

  deletePendingExpendedDonation = async (
    donator: string,
    donationNumber: number
  ): Promise<boolean> => {
    try {
      const allPendingExpendedDonations = await this.redis.getAllPendingExpendedDonations();

      let updatedPendingExpendedDonations: IPendingExpendedDonation[] = [];

      allPendingExpendedDonations.map((p) => {
        if (
          p.donator.toLowerCase() === donator.toLowerCase() &&
          p.donationNumber === donationNumber
        ) {
          return;
        }

        updatedPendingExpendedDonations.push({
          ...p,
          valueExpendedETH: p.valueExpendedETH.toString(),
        });
      });

      console.log(
        'updatedPendingExpendedDonations:',
        updatedPendingExpendedDonations
      );

      const stringifedUpdated = updatedPendingExpendedDonations.map((d) =>
        JSON.stringify(d)
      );

      await deleteKey(RedisKeys.PENDING_EXPENDED_DONATIONS);

      if (updatedPendingExpendedDonations.length > 0) {
        await this.redis.pushToPendingExpendedDonations(stringifedUpdated);
      }

      return true;
    } catch (e) {
      console.log('Could not delete pending expended donation in Helpers:', e);

      return false;
    }
  };

  refundDonation = async (args: IPendingRefund): Promise<boolean> => {
    try {
      const refundDonationRes = await this.infura.refundDonation(args);

      if (!refundDonationRes) {
        if (this.numRetries > 0) {
          console.log('Retry in createRefund');

          this.numRetries -= 1;

          await this.sleep();

          return await this.refundDonation(args);
        } else {
          console.log('Ran out of retries in createRefund for Helpers:', args);
        }
      }

      await this.deletePendingRefund(args.address, Number(args.donationNumber));

      return true;
    } catch (e) {
      console.log('Error in createRefund in Helpers:', e);

      await this.deletePendingRefund(args.address, Number(args.donationNumber));

      return false;
    }
  };

  deletePendingRefund = async (
    address: string,
    donationNumber: number
  ): Promise<boolean> => {
    try {
      const allPendingRefunds = await this.redis.getAllPendingRefunds();

      let updatedPendingRefunds: IPendingRefund[] = [];

      allPendingRefunds.map((p) => {
        if (
          p.address.toLowerCase() === address.toLowerCase() &&
          p.donationNumber === donationNumber
        ) {
          return;
        }

        updatedPendingRefunds.push(p);
      });

      console.log('updatedPendingRefunds:', updatedPendingRefunds);

      const stringified = updatedPendingRefunds.map((r) => JSON.stringify(r));

      await deleteKey(RedisKeys.PENDING_REFUNDS);

      if (updatedPendingRefunds.length > 0) {
        await this.redis.pushToPendingRefunds(stringified);
      }

      return true;
    } catch (e) {
      console.log('Could not delete pending expended donation in Helpers:', e);

      return false;
    }
  };

  sleep = (milliseconds?: number): Promise<void> => {
    return new Promise((resolve) =>
      setTimeout(() => resolve(), milliseconds || 1000)
    );
  };
}

export default Helpers;
