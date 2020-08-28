import Web3 from 'web3';
import { find, map } from 'lodash';

import Config from '../config';
import StandardCharityContractFunctions from './StandardCharity/ContractFunctions';
import StandardCharityContractEvents, {
  ContractEventName,
  IEventWithTopic,
  IContractEvent,
} from './StandardCharity/ContractEvents';

const config = Config[Config.env];

class Infura extends StandardCharityContractFunctions {
  newBlockHeadersSubscription: any;
  web3?: any;
  eventNames: ContractEventName[];
  standardCharityContractSubscription: any;

  constructor() {
    super();

    this.eventNames = [
      'LogNewDonation',
      'LogNewExpenditure',
      'LogNewExpendedDonation',
      'LogNewRefund',
    ];
  }

  public initializeWebsocket = () => {
    if (!this.standardCharityAbi) {
      console.log(
        'Could not get Standard Charity ABI in websocket initialization'
      );

      return this.onSocketClose();
    }

    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(config.infura.websocket.url)
    );

    this.subscribeToBlockHeaders();

    this.subscribeToEvents();

    if (!this.web3 || !this.web3.currentProvider) {
      return this.onSocketClose();
    }

    this.web3.currentProvider.on('end', () => {
      console.log('Web3 provider closed');

      this.onSocketClose();
    });
  };

  private subscribeToBlockHeaders = () => {
    try {
      if (!this.web3) {
        console.log('web3 was null in subscribeToBlockHeaders');

        return;
      }

      this.newBlockHeadersSubscription = this.web3.eth
        .subscribe('newBlockHeaders')
        .on('data', (_: any) => {
          console.log('Infura connection still alive');
        })
        .on('error', (error: any) => {
          console.log('newBlockHeaders subscription error:', error);
        })
        .on('end', (e: any) => {
          console.log('newBlockHeaders websocket closed:', e);

          this.onSocketClose();
        })
        .on('close', (e: any) => {
          console.log('newBlockHeaders websocket closed:', e);

          this.onSocketClose();
        });
    } catch (e) {
      console.log('Catch error in subscribeToBlockHeaders:', e);
    }
  };

  private subscribeToEvents = () => {
    try {
      if (!this.web3) {
        console.log('web3 was null in subscribeToBlockHeaders');

        return this.onSocketClose();
      }

      const StandardCharityContract = new this.web3.eth.Contract(
        this.standardCharityAbi.abi,
        config.contracts.standardCharity.address
      );

      const eventsWithTopics: IEventWithTopic[] = [];

      this.eventNames.map((event) => {
        try {
          const signature = find(
            StandardCharityContract._jsonInterface,
            (o) => o.name === event
          ).signature as string;

          if (!signature) {
            console.log('Could not find signature for event:', event);

            return;
          }

          eventsWithTopics.push({
            event,
            topic: signature,
          });
        } catch (e) {
          console.log('Could not get singature for event:', e);
        }
      });

      this.standardCharityContractSubscription = this.web3.eth
        .subscribe('logs', {
          address: [config.contracts.standardCharity.address],
          topics: [map(eventsWithTopics, 'topic')],
        })
        .on('connected', () => {
          console.log('Infura websocket connected');
        })
        .on('data', (event: IContractEvent) => {
          console.log('Contract event:', event);

          new StandardCharityContractEvents(eventsWithTopics).init(event);
        })
        .on('error', (error: any) => {
          console.log(
            'standardCharityContractSubscription subscription error:',
            error
          );
        })
        .on('end', (e: any) => {
          console.log(
            'standardCharityContractSubscription websocket ended:',
            e
          );

          this.onSocketClose();
        })
        .on('close', (e: any) => {
          console.log(
            'standardCharityContractSubscription websocket closed:',
            e
          );

          this.onSocketClose();
        });
    } catch (e) {
      console.log('subscribeToEvents catch error:', e);
    }
  };

  private onSocketClose = () => {
    this.web3 = null;

    this.unsubscribeListeners();

    this.reconnectToWebsocket();
  };

  public unsubscribeListeners = () => {
    if (this.standardCharityContractSubscription) {
      try {
        this.standardCharityContractSubscription.unsubscribe(
          (error: any, _: any) => {
            if (error) {
              console.log(
                'standardCharityContractSubscription unsub error:',
                error
              );
            }

            console.log('standardCharityContractSubscription unsubscribed');
          }
        );
      } catch (e) {
        console.log(
          'standardCharityContractSubscription unsubscribe error:',
          e
        );
      }
    }

    if (this.newBlockHeadersSubscription) {
      try {
        this.newBlockHeadersSubscription.unsubscribe((error: any, _: any) => {
          if (error) {
            console.log('newBlockHeaders unsub error:', error);
          }

          console.log('newBlockHeaders unsubscribed');
        });
      } catch (e) {
        console.log('newBlockHeaders unsubscribe error:', e);
      }
    }
  };

  private reconnectToWebsocket = () => {
    setTimeout(() => {
      this.initializeWebsocket();
    }, 2000);
  };
}

export default Infura;
