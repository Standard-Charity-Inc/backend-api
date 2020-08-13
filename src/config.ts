import { join } from 'path';

interface IPlatform {
  port: number;
  infura: {
    endpoint: string;
    projectId: string;
    projectSecret: string;
    websocket: {
      url: string;
    };
  };
  contracts: {
    standardCharity: {
      address: string;
      abiFilePath: string;
    };
  };
}

interface IConfig {
  env: 'dev' | 'prod';
  cors: {
    [key: string]: string | boolean;
  };
  dev: IPlatform;
  prod: IPlatform;
}

const config: IConfig = {
  env: process.env.NODE_ENV === 'prod' ? 'prod' : 'dev',
  cors: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  dev: {
    port: 3001,
    infura: {
      endpoint: `https://mainnet.infura.io/v3/${
        process.env.INFURA_PROJECT_ID_DEV as string
      }`,
      projectId: process.env.INFURA_PROJECT_ID_DEV as string,
      projectSecret: process.env.INFURA_PROJECT_SECRET_DEV as string,
      websocket: {
        url: `wss://mainnet.infura.io/ws/v3/${
          process.env.INFURA_PROJECT_ID_DEV as string
        }`,
      },
    },
    contracts: {
      standardCharity: {
        address: process.env.STANDARD_CHARITY_CONTRACT_ADDRESS_DEV as string,
        abiFilePath: join(
          __dirname,
          'contracts',
          'StandardCharity_Rinkeby.json'
        ),
      },
    },
  },
  prod: {
    port: 3002,
    infura: {
      endpoint: `https://mainnet.infura.io/v3/${
        process.env.INFURA_PROJECT_ID_PROD as string
      }`,
      projectId: process.env.INFURA_PROJECT_ID_PROD as string,
      projectSecret: process.env.INFURA_PROJECT_SECRET_PROD as string,
      websocket: {
        url: `wss://mainnet.infura.io/ws/v3/${
          process.env.INFURA_PROJECT_ID_PROD as string
        }`,
      },
    },
    contracts: {
      standardCharity: {
        address: process.env.STANDARD_CHARITY_CONTRACT_ADDRESS_PROD as string,
        abiFilePath: join(
          __dirname,
          'contracts',
          'StandardCharity_Mainnet.json'
        ),
      },
    },
  },
};

export default config;
