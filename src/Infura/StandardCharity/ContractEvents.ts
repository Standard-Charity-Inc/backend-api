import ABI from './ABI';
import { find, filter } from 'lodash';

import { decodeFunctionResult } from '../../utils/ethereum';
import {
  ContractFunctionName,
  IDonation,
  IPendingExpendedDonation,
} from '../../types';
import Infura from '..';
import Redis, { RedisKeys } from '../../redis';
import { deleteKey } from '../../redis/instance';
import PendingExpendedDonations from '../../routes/ExpendedDonations/PendingExpendedDonations';
import BN from 'bn.js';
import Helpers from './Helpers';
import { log } from 'util';

export type ContractEventName =
  | 'LogNewDonation'
  | 'LogNewExpenditure'
  | 'LogNewExpendedDonation'
  | 'LogNewRefund'
  | 'LogNewNextDonationToExpend';

export interface IEventWithTopic {
  event: ContractEventName;
  topic: string;
}

export interface IContractEvent {
  removed: boolean;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: number;
  data: string;
  topics: string[];
  id: string;
}

interface ILogNewDonationEvent {
  donator: string;
  donationNumber: string;
  value: string;
  overallDonationNumber: string;
}

interface ILogNewExpenditureEvent {
  expenditureNumber: string;
  valueETH: string;
}

interface ILogNewDonationToExpendEvent {
  nextDonationToExpend: string;
}

interface ILogNewExpendedDonationEvent {
  donator: string;
  donationNumber: number;
  expeditureNumber: number;
  expendedDonationNumber: number;
}

interface ILogNewRefundEvent {
  donator: string;
  donationNumber: number;
  valueETH: number;
}

class ContractEvents extends ABI {
  eventsWithTopics: IEventWithTopic[];
  redis: Redis;
  infura: Infura;

  constructor(eventsWithTopics: IEventWithTopic[]) {
    super();

    this.eventsWithTopics = eventsWithTopics;
    this.redis = new Redis();
    this.infura = new Infura();
  }

  public init = (event: IContractEvent) => {
    try {
      if (
        !event ||
        !event.topics ||
        !Array.isArray(event.topics) ||
        !event.topics[0]
      ) {
        console.log('Contract event was malformed:', event);

        return;
      }
      const eventWithTopic = find(
        this.eventsWithTopics,
        (o) => o.topic === event.topics[0]
      );

      if (!eventWithTopic) {
        console.log(
          'Could not get eventWithTopic in ContractEvents init:',
          event
        );

        return;
      }

      const eventName = eventWithTopic.event;

      console.log(`${eventName}:`, event);

      if (!eventName) {
        console.log('Could not get eventName in ContractEvents init');

        return;
      }

      switch (eventName) {
        case 'LogNewDonation':
          return this.newDonation(event);
        case 'LogNewExpenditure':
          return this.newExpenditure(event);
        case 'LogNewExpendedDonation':
          return this.newExpendedDonation(event);
        case 'LogNewRefund':
          return this.newRefund(event);
        case 'LogNewNextDonationToExpend':
          return this.newDonationToExpend(event);
        default:
          console.log('Event was unrecongnized in ContractEvents:', event);

          break;
      }
    } catch (e) {
      console.log('Catch error in ContractEvents init:', e);
    }
  };

  public newDonation = async (event: IContractEvent) => {
    try {
      const decodedData = this.decodeEventData(event, 'LogNewDonation');

      if (!decodedData) {
        console.log(
          'Could not get decodedData for newDonation in ContractEvents'
        );

        return;
      }

      const logNewDonationEvent: ILogNewDonationEvent = decodedData as ILogNewDonationEvent;

      if (
        !logNewDonationEvent.donator ||
        !logNewDonationEvent.donationNumber ||
        !logNewDonationEvent.overallDonationNumber
      ) {
        console.log(
          'Could not get donator address and/or donationNumber from decodedData in newDonation for ContractEvents'
        );

        return;
      }

      const donation = await new Helpers().getDonation(
        logNewDonationEvent.donator,
        Number(logNewDonationEvent.donationNumber)
      );

      if (!donation) {
        console.log('Could not get donation in newDonation for ContractEvents');

        return;
      }

      await this.redis.pushDonation(JSON.stringify(donation));

      await this.redis.setTotalNumDonations();

      await this.redis.setMaxDonation();

      await this.redis.setLatestDonation();

      await this.redis.setTotalDonationsEth();

      await this.redis.setStandardCharityContractBalance();

      const donationTrackerItem = await new Helpers().getDonationTracker(
        Number(logNewDonationEvent.overallDonationNumber)
      );

      if (!donationTrackerItem) {
        console.log(
          'Could not get donationTrackerItem in newDonation for ContractEvents'
        );

        return;
      }

      await this.redis.pushDonationTrackerItem(
        JSON.stringify(donationTrackerItem)
      );
    } catch (e) {
      console.log('Catch error in newDonation for ContractEvents:', e);
    }
  };

  public newExpenditure = async (event: IContractEvent) => {
    try {
      const decodedData = this.decodeEventData(event, 'LogNewExpenditure');

      if (!decodedData) {
        console.log(
          'Could not get decodedData for newExpenditure in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const logNewExpenditureEvent: ILogNewExpenditureEvent = decodedData as ILogNewExpenditureEvent;

      if (
        !logNewExpenditureEvent ||
        !logNewExpenditureEvent.expenditureNumber ||
        !logNewExpenditureEvent.valueETH
      ) {
        console.log(
          'Could not get necessary elements for expenditure for newExpenditure in ContractEvents:',
          logNewExpenditureEvent
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      if (isNaN(Number(logNewExpenditureEvent.expenditureNumber))) {
        console.log('expenditureNumber was NaN in ContractEvents');

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const expenditure = await new Helpers().getExpenditure(
        Number(logNewExpenditureEvent.expenditureNumber)
      );

      if (!expenditure) {
        console.log(
          'Could not get expenditure in newExpenditure in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const allExpenditures = await this.redis.getAllExpenditures();

      const existingExpenditure = find(
        allExpenditures,
        (o) => o.expenditureNumber === Number(expenditure.expenditureNumber)
      );

      if (existingExpenditure) {
        console.log('Expenditure has already been added. Stopping event');

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      await this.redis.pushExpenditure(JSON.stringify(expenditure));

      await this.redis.setTotalNumExpenditures();

      await this.redis.setTotalExpendedEth();

      await this.redis.setTotalExpendedUsd();

      await this.redis.setStandardCharityContractBalance();

      await this.redis.setTotalPlatesDeployed();

      await new PendingExpendedDonations(
        new BN(expenditure.valueExpendedETH),
        Number(expenditure.valueExpendedUSD),
        Number(expenditure.expenditureNumber),
        Number(expenditure.platesDeployed)
      ).init();

      const allPendingExpendedDonations = await this.redis.getAllPendingExpendedDonations();

      if (allPendingExpendedDonations.length === 0) {
        console.log(
          'Pending expended donations were empty. Stopping expenditure event.'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      new Helpers().createExpendedDonation(allPendingExpendedDonations[0]);
    } catch (e) {
      console.log('Catch error in newExpenditure for ContractEvents:', e);
    }
  };

  public newExpendedDonation = async (event: IContractEvent) => {
    try {
      const decodedData = this.decodeEventData(event, 'LogNewExpendedDonation');

      if (!decodedData) {
        console.log(
          'Could not get decodedData for newExpendedDonation in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const logNewExpendedDonationEvent: ILogNewExpendedDonationEvent = decodedData as ILogNewExpendedDonationEvent;

      if (
        !logNewExpendedDonationEvent ||
        !logNewExpendedDonationEvent.donationNumber ||
        !logNewExpendedDonationEvent.donator ||
        !logNewExpendedDonationEvent.expeditureNumber ||
        !logNewExpendedDonationEvent.expendedDonationNumber
      ) {
        console.log(
          'Could not get necessary elements for newExpendedDonation in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const expendedDonation = await new Helpers().getExpendedDonation(
        logNewExpendedDonationEvent.expendedDonationNumber
      );

      if (!expendedDonation) {
        console.log(
          'Could not get expendedDonation in newExpendedDonation for ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      await this.redis.pushExpendedDonation(JSON.stringify(expendedDonation));

      const donationUpdated = await this.updateDonation(
        expendedDonation.donator,
        Number(expendedDonation.donationNumber)
      );

      if (!donationUpdated) {
        await this.redis.setIsCreatingExpenditure(false);
      }

      await this.redis.setTotalNumExpendedDonations();

      const allPendingExpendedDonations = await this.redis.getAllPendingExpendedDonations();

      console.log('allPendingExpendedDonations:', allPendingExpendedDonations);

      if (allPendingExpendedDonations.length > 0) {
        return new Helpers().createExpendedDonation(
          allPendingExpendedDonations[0]
        );
      }

      const pendingNextDonationToExpend = await this.redis.getPendingNextDonationToExpend();

      if (pendingNextDonationToExpend) {
        await this.infura.setNextDonationToExpend(pendingNextDonationToExpend);

        await deleteKey(RedisKeys.PENDING_NEXT_DONATION_TO_EXPEND);

        return;
      }

      await this.redis.setIsCreatingExpenditure(false);
    } catch (e) {
      console.log('Catch error in newExpendedDonation for ContractEvents:', e);

      await this.redis.setIsCreatingExpenditure(false);
    }
  };

  public newRefund = async (event: IContractEvent) => {
    try {
      const decodedData = this.decodeEventData(event, 'LogNewRefund');

      if (!decodedData) {
        console.log(
          'Could not get decodedData for newRefund in ContractEvents'
        );

        await this.redis.setIsCreatingRefunds(false);

        return;
      }

      const logNewRefundEvent: ILogNewRefundEvent = decodedData as ILogNewRefundEvent;

      if (
        !logNewRefundEvent ||
        !logNewRefundEvent.donator ||
        !logNewRefundEvent.donationNumber
      ) {
        console.log(
          'Could not get necessary elements for newRefund in ContractEvents'
        );

        await this.redis.setIsCreatingRefunds(false);

        return;
      }

      // There is sometimes a delay between the event and updated data from Infura
      // The delay is usually less than 1 second, but let's be safe
      await new Helpers().sleep(5000);

      const donationUpdated = await this.updateDonation(
        logNewRefundEvent.donator,
        Number(logNewRefundEvent.donationNumber)
      );

      if (!donationUpdated) {
        console.log('Could not update donation in logNewRefund');
      }

      await this.redis.setStandardCharityContractBalance();

      const allPendingRefunds = await this.redis.getAllPendingRefunds();

      console.log('allPendingRefunds:', allPendingRefunds);

      if (
        Array.isArray(allPendingRefunds) &&
        allPendingRefunds.length > 0 &&
        allPendingRefunds[0]
      ) {
        return new Helpers().refundDonation(allPendingRefunds[0]);
      }

      console.log('Completed pending refunds');

      await this.redis.setIsCreatingRefunds(false);
    } catch (e) {
      console.log('Error while processing newRefund event:', e);

      await this.redis.setIsCreatingRefunds(false);
    }
  };

  public newDonationToExpend = async (event: IContractEvent) => {
    try {
      const decodedData = this.decodeEventData(
        event,
        'LogNewNextDonationToExpend'
      );

      if (!decodedData) {
        console.log(
          'Could not get decodedData for newDonationToExpend in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      const logNewDonationToExpendEvent: ILogNewDonationToExpendEvent = decodedData as ILogNewDonationToExpendEvent;

      if (
        !logNewDonationToExpendEvent ||
        !logNewDonationToExpendEvent.nextDonationToExpend
      ) {
        console.log(
          'Could not get necessary elements for newDonationToExpend in ContractEvents'
        );

        await this.redis.setIsCreatingExpenditure(false);

        return;
      }

      await this.redis.setNextDonationToExpend(
        Number(logNewDonationToExpendEvent.nextDonationToExpend)
      );

      await this.redis.setIsCreatingExpenditure(false);
    } catch (e) {
      console.log('Catch error in newDonationToExpend for ContractEvents:', e);

      await this.redis.setIsCreatingExpenditure(false);
    }
  };

  updateDonation = async (
    donator: string,
    donationNumber: number
  ): Promise<boolean> => {
    try {
      const updatedDonation = await new Helpers().getDonation(
        donator,
        donationNumber
      );

      if (!updatedDonation) {
        console.log(
          'Could not get updated donation in updateDonation for ContractEvents'
        );

        return false;
      }

      console.log('\n\n');

      console.log('updatedDonation:', updatedDonation);

      const allDonations = await this.redis.getAllDonations();

      console.log('allDonations:', allDonations);

      let updatedDonations: IDonation[] = [];

      allDonations.map((d) => {
        if (
          d.donator.toLowerCase() === donator.toLowerCase() &&
          d.donationNumber === donationNumber
        ) {
          return;
        }

        updatedDonations.push(d);
      });

      updatedDonations = [...updatedDonations, updatedDonation];

      console.log('updatedDonations:', updatedDonations);

      const stringifiedDonations = updatedDonations.map((d) =>
        JSON.stringify(d)
      );

      console.log('\n\n');

      await deleteKey(RedisKeys.ALL_DONATIONS);

      await this.redis.pushDonation(stringifiedDonations);

      return true;
    } catch (e) {
      console.log('Error in updateDonation in ContractEvents:', e);

      return false;
    }
  };

  private decodeEventData = (
    event: IContractEvent,
    functionName: ContractFunctionName
  ): { [key: string]: any } | null => {
    try {
      return decodeFunctionResult(
        this.standardCharityAbi.abi,
        functionName,
        event.data,
        'inputs'
      );
    } catch (e) {
      console.log('decodeEventData error in ContractEvents:', e);

      return null;
    }
  };
}

export default ContractEvents;
