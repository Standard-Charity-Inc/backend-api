import * as redis from 'redis';

let redisClient: redis.RedisClient;

const init = (): Promise<void> => {
  return new Promise((resolve) => {
    const client = redis.createClient();

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
): Promise<string[]> => {
  try {
    return new Promise((resolve) => {
      redisClient.lrange(key, start, stop, (err, res) => {
        if (err) {
          console.log('Could not readLrange:', err);

          return resolve([]);
        }

        resolve(res || []);
      });
    });
  } catch (e) {
    console.log('readLRange error:', e);

    return [];
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
  }
};

export const getValue = async (key: string): Promise<string | null> => {
  try {
    return new Promise((resolve) => {
      redisClient.get(key, (err, value) => {
        if (err) {
          console.log('Error while getting value for redis:', err);

          return resolve(null);
        }

        resolve(value || null);
      });
    });
  } catch (e) {
    console.log('Could not get value for redis:', e);

    return null;
  }
};

export const lpush = async (key: string, items: string[]): Promise<void> => {
  try {
    return new Promise((resolve) => {
      redisClient.lpush(key, ...items, (err) => {
        if (err) {
          console.log('Error in lpush for redis:', err);
        }

        resolve();
      });
    });
  } catch (e) {
    console.log('Could not lpush for redis:', e);
  }
};

export const deleteKey = async (key: string): Promise<void> => {
  try {
    return new Promise((resolve) => {
      redisClient.del(key, () => {
        resolve();
      });
    });
  } catch (e) {
    console.log('Could not deleteKey for redis:', e);
  }
};

export { init, redisClient };
