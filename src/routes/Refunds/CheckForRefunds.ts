import BN from 'bn.js';

import Redis, { RedisKeys } from '../../redis';
import { IPendingRefund } from '../../types';
import Helpers from '../../Infura/StandardCharity/Helpers';
import { deleteKey } from '../../redis/instance';

class CheckForRefunds {
  redis: Redis;

  constructor() {
    this.redis = new Redis();
  }

  init = async (): Promise<void> => {
    try {
      await this.redis.setIsCreatingRefunds(true);

      const pendingRefunds = await this.buildPendingRefunds();

      if (pendingRefunds.length === 0 || !pendingRefunds[0]) {
        return await this.endCheckForRefunds('No refunds to create. Stopping.');
      }

      console.log('allPendingRefunds:', pendingRefunds);

      const stringifiedRefunds = pendingRefunds.map((refund) =>
        JSON.stringify(refund)
      );

      await deleteKey(RedisKeys.PENDING_REFUNDS);

      await this.redis.pushToPendingRefunds(stringifiedRefunds);

      new Helpers().refundDonation(pendingRefunds[0]);
    } catch (e) {
      await this.endCheckForRefunds(`Error in CheckForRefunds init: ${e}`);
    }
  };

  buildPendingRefunds = async (): Promise<IPendingRefund[]> => {
    try {
      const currentSeconds = Math.round(new Date().getTime() / 1000);

      const daysAgoToCheck = 27;

      const secondsAgoToCheck = daysAgoToCheck * 86400;

      const timeToCheck = currentSeconds - secondsAgoToCheck;

      const allDonations = await this.redis.getAllDonations();

      const pendingRedunds: IPendingRefund[] = [];

      await Promise.all(
        allDonations.map(async (donation) => {
          try {
            if (donation.timestamp < timeToCheck) {
              return;
            }

            const valueETHToRefund = new BN(donation.value)
              .sub(new BN(donation.valueExpendedETH))
              .sub(new BN(donation.valueRefundedETH));

            if (valueETHToRefund.eq(new BN(0))) {
              return;
            }

            pendingRedunds.push({
              address: donation.donator,
              donationNumber: donation.donationNumber,
              valueETHToRefund: valueETHToRefund.toString(),
            });
          } catch (e) {
            console.log('Error in allDonations mapping in CheckForRefunds:', e);
          }
        })
      );

      return pendingRedunds;
    } catch (e) {
      console.log('buildPendingRefunds error:', e);

      return [];
    }
  };

  endCheckForRefunds = async (message: any): Promise<void> => {
    try {
      console.log(message);
    } catch (e) {
      console.log('endCheckForRefunds error:', e);
    }

    await this.redis.setIsCreatingRefunds(false);
  };
}

export default CheckForRefunds;
