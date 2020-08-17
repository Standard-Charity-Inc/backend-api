import { redisClient, setValue } from './instance';
import Infura from '../Infura';

enum RedisKeys {
  TOTAL_NUM_DONATIONS = 'totalNumDonations',
  ALL_DONATIONS = 'allDonations',
}

class Redis {
  public fillCache = async (): Promise<void> => {
    try {
      await this.flushCache();

      const infura = new Infura();

      const totalNumDonations = await infura.callStandardCharityContract(
        'getTotalNumDonations',
        0,
        []
      );

      await setValue(
        RedisKeys.TOTAL_NUM_DONATIONS,
        totalNumDonations && totalNumDonations['0']
          ? totalNumDonations['0']
          : '0'
      );

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
}

export default Redis;
