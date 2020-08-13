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

export { init, redisClient };
