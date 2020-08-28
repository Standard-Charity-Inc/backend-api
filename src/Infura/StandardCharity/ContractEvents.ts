import ABI from './ABI';
import { find } from 'lodash';

import { decodeFunctionResult } from '../../utils/ethereum';
import { ContractFunctionName } from '../../types';
import Infura from '..';
import Redis from '../../redis';
import { red } from 'bn.js';

export type ContractEventName =
  | 'LogNewDonation'
  | 'LogNewExpenditure'
  | 'LogNewExpendedDonation'
  | 'LogNewRefund';

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
}

class ContractEvents extends ABI {
  eventsWithTopics: IEventWithTopic[];

  constructor(eventsWithTopics: IEventWithTopic[]) {
    super();

    this.eventsWithTopics = eventsWithTopics;
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
        console.log('Could not get eventWithTopic in ContractEvents init');

        return;
      }

      const eventName = eventWithTopic.event;

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

      if (!logNewDonationEvent.donator || !logNewDonationEvent.donationNumber) {
        console.log(
          'Could not get donator address and/or donationNumber from decodedData in newDonation for ContractEvents'
        );

        return;
      }

      const donation = await new Infura().getDonation(
        logNewDonationEvent.donator,
        Number(logNewDonationEvent.donationNumber)
      );

      if (!donation) {
        console.log('Could not get donation in newDonation for ContractEvents');

        return;
      }

      const redis = new Redis();

      await redis.pushDonation(JSON.stringify(donation));

      await redis.setTotalNumDonations();

      await redis.setMaxDonation();

      await redis.setLatestDonation();

      await redis.setTotalDonationsEth();

      await redis.setStandardCharityContractBalance();
    } catch (e) {
      console.log('Catch error in newDation for ContractEvents:', e);
    }
  };

  public newExpenditure = (event: IContractEvent) => {};

  public newExpendedDonation = (event: IContractEvent) => {};

  public newRefund = (event: IContractEvent) => {};

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
