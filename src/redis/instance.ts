import { promisifyAll } from 'bluebird';
import * as redis from 'redis';

let redisClient: redis.RedisClient;

const init = (): Promise<void> => {
  return new Promise((resolve) => {
    const client = redis.createClient();

    promisifyAll(redis.RedisClient.prototype);
    promisifyAll(redis.Multi.prototype);

    redisClient = client;

    redisClient.on('connect', (err) => {
      if (err) {
        return console.log('Error connecting to redis:', err);
      }

      console.log('redis connected');
    });

    redisClient.on('error', (err) => {
      console.log('redis error:', err);
    });

    resolve();
  });
};

export const readLrange = async (
  key: string,
  start: number,
  stop: number
): Promise<string[] | null> => {
  try {
    return new Promise((resolve) => {
      redisClient.lrange(key, start, stop, (err, res) => {
        if (err) {
          console.log('Could not read lrange:', err);

          return resolve(null);
        }

        resolve(res || []);
      });
    });
  } catch (e) {
    console.log('readLRange error:', e);

    return null;
  }
};

export const setValue = async (key: string, value: string): Promise<void> => {
  try {
    return new Promise((resolve) => {
      redisClient.set(key, value, (err) => {
        if (err) {
          console.log('Error while setting value for redis:', err);
        }

        resolve();
      });
    });
  } catch (e) {
    console.log('Could not setValue for redis:', e);

    return;
  }
};

export { init, redisClient };
