import BN from 'bn.js';
import { find } from 'lodash';

import Infura from '../../Infura';
import Redis, { RedisKeys } from '../../redis';
import { setValue } from '../../redis/instance';
import { IDonation, IPendingExpendedDonation } from '../../types';

class PendingExpendedDonations {
  infura: Infura;
  redis: Redis;
  expenditureWei: BN;
  expenditureUsd: number;
  expenditureNumber: number;
  expenditurePlatesDeployed: number;

  constructor(
    expenditureWei: BN,
    expenditureUsd: number,
    expenditureNumber: number,
    expenditurePlatesDeployed: number
  ) {
    this.infura = new Infura();
    this.redis = new Redis();

    this.expenditureWei = expenditureWei;
    this.expenditureUsd = expenditureUsd;
    this.expenditureNumber = expenditureNumber;
    this.expenditurePlatesDeployed = expenditurePlatesDeployed;
  }

  init = async (): Promise<boolean> => {
    const expendedDonationsCreated = await this.createPendingExpendedDonation(
      this.expenditureWei,
      this.expenditureUsd,
      this.expenditurePlatesDeployed
    );

    if (typeof expendedDonationsCreated === 'string') {
      console.log(
        'Error while creating expended donations:',
        expendedDonationsCreated
      );

      return false;
    }

    console.log('Expended donations successfully created');

    return true;
  };

  private createPendingExpendedDonation = async (
    weiRemainingToExpend: BN,
    usdRemainingToExpend: number,
    remainingPlatesToDeply: number
  ): Promise<string | boolean> => {
    try {
      const nextDonationToExpend = await this.redis.getNextDonationToExpend();

      if (!nextDonationToExpend) {
        return 'Could not get next donation to expend';
      }

      const donationTrackerItems = await this.redis.getDonationTrackerItems();

      const donationTrackerItem = find(
        donationTrackerItems,
        (o) => o.overallDonationNum === nextDonationToExpend
      );

      if (!donationTrackerItem) {
        return 'Could not get donation tracker item to create expended donation';
      }

      const allDonations = await this.redis.getAllDonations();

      const donationToExpend = find(
        allDonations,
        (o) =>
          o.donator.toLowerCase() ===
            donationTrackerItem.address.toLowerCase() &&
          o.donationNumber === donationTrackerItem.addressDonationNum
      );

      console.log('donationToExpend:', donationToExpend);

      if (!donationToExpend) {
        return 'Could not get donation to expend';
      }

      // Check to make sure there is value left in the donation to expend
      const weiAvailableToExpend = new BN(donationToExpend.value)
        .sub(new BN(donationToExpend.valueExpendedETH))
        .sub(new BN(donationToExpend.valueRefundedETH));

      console.log('weiAvailableToExpend:', weiAvailableToExpend.toString());

      if (weiAvailableToExpend.lte(new BN(0))) {
        console.log('Ran update new donation to expend method 1');

        const setNewDonationToExpend = await this.setNewDonationToExpend(
          allDonations,
          (nextDonationToExpend as number) + 1,
          false
        );

        if (typeof setNewDonationToExpend === 'string') {
          return setNewDonationToExpend;
        }

        return this.createPendingExpendedDonation(
          weiRemainingToExpend,
          usdRemainingToExpend,
          remainingPlatesToDeply
        );
      }

      let weiToExpend = weiRemainingToExpend;

      if (weiRemainingToExpend.gt(weiAvailableToExpend)) {
        weiToExpend = weiAvailableToExpend;
      }

      const proportionOfWei = Number(
        Number(weiToExpend.toString()) / Number(this.expenditureWei.toString())
      );

      const usdToExpend = Math.round(this.expenditureUsd * proportionOfWei);

      const platesToDeploy = Math.round(
        this.expenditurePlatesDeployed * proportionOfWei
      );

      const pendingExpendedDonation: IPendingExpendedDonation = {
        donator: donationToExpend.donator,
        valueExpendedETH: weiToExpend.toString(),
        valueExpendedUSD: usdToExpend,
        donationNumber: donationToExpend.donationNumber,
        expenditureNumber: this.expenditureNumber,
        platesDeployed: platesToDeploy,
      };

      await this.redis.pushToPendingExpendedDonations(
        JSON.stringify(pendingExpendedDonation)
      );

      if (weiRemainingToExpend.gt(weiAvailableToExpend)) {
        console.log('Ran update new donation to expend method 2');

        const setNewDonationToExpend = await this.setNewDonationToExpend(
          allDonations,
          (nextDonationToExpend as number) + 1,
          false
        );

        if (typeof setNewDonationToExpend === 'string') {
          return setNewDonationToExpend;
        }

        return this.createPendingExpendedDonation(
          weiRemainingToExpend.sub(weiToExpend),
          usdRemainingToExpend - usdToExpend,
          remainingPlatesToDeply - platesToDeploy
        );
      }

      if (weiRemainingToExpend.eq(weiAvailableToExpend)) {
        console.log('Ran update new donation to expend method 3');

        await this.setNewDonationToExpend(
          allDonations,
          (nextDonationToExpend as number) + 1,
          true
        );
      } else {
        console.log('Ran update new donation to expend method 4');

        await this.setNewDonationToExpend(
          allDonations,
          nextDonationToExpend as number,
          true
        );
      }

      return true;
    } catch (e) {
      console.log('expendDonation error in CreateExpenditure:', e);

      return 'Could not complete creating expended donations';
    }
  };

  setNewDonationToExpend = async (
    allDonations: IDonation[],
    newDonationToExpend: number,
    isLast: boolean
  ): Promise<string | boolean> => {
    try {
      console.log('allDonations:', allDonations);

      console.log('newDonationToExpend:', newDonationToExpend);

      const donationTrackerItems = await this.redis.getDonationTrackerItems();

      const item = find(
        donationTrackerItems,
        (o) => o.overallDonationNum === newDonationToExpend
      );

      if (!item) {
        return 'There are no more donations to expend';
      }

      await setValue(
        RedisKeys.NEXT_DONATION_TO_EXPEND,
        newDonationToExpend.toString()
      );

      if (isLast) {
        const contractNextToExpend = await this.infura.getNextDonationToExpend();

        console.log('contractNextToExpend:', contractNextToExpend);

        console.log('newDonationToExpend:', newDonationToExpend);

        if (contractNextToExpend === newDonationToExpend) {
          console.log(
            'New donation to expend is the same as current. Not updating'
          );

          return true;
        }

        await this.redis.setPendingNextDonationToExpend(newDonationToExpend);
      }

      return true;
    } catch (e) {
      console.log('setNewDonationToExpend error in CreateExpenditure:', e);

      return 'Error while setting next donation to expend';
    }
  };
}

export default PendingExpendedDonations;
