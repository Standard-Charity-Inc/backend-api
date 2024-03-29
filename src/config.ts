import { join } from 'path';
import { ethers } from 'ethers';
import { mnemonicToWallet } from './utils/ethereum';

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
  ethereum: {
    wallet: ethers.Wallet | null;
  };
  aws: {
    accessKey: string;
    secretAccessKey: string;
    s3: {
      bucketName: string;
      bucketUrl: string;
    };
  };
  vimeo: {
    clientId: string;
    token: string;
    clientSecret: string;
  };
  mailchimp: {
    api: {
      apiKey: string;
      serverPrefix: string;
    };
    list: {
      name: string;
    };
  };
  blocknative: {
    api: {
      url: string;
      key: string;
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
      endpoint: `https://rinkeby.infura.io/v3/${
        process.env.INFURA_PROJECT_ID_DEV as string
      }`,
      projectId: process.env.INFURA_PROJECT_ID_DEV as string,
      projectSecret: process.env.INFURA_PROJECT_SECRET_DEV as string,
      websocket: {
        url: `wss://rinkeby.infura.io/ws/v3/${
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
          'StandardCharity',
          'rinkeby.json'
        ),
      },
    },
    ethereum: {
      wallet: process.env.ETH_WALLET_MNEMONIC_DEV
        ? mnemonicToWallet(process.env.ETH_WALLET_MNEMONIC_DEV as string)
        : null,
    },
    aws: {
      accessKey: process.env.AWS_ACCESS_KEY_ID_DEV as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DEV as string,
      s3: {
        bucketName: process.env.S3_BUCKET_NAME_DEV as string,
        bucketUrl: process.env.S3_BUCKET_URL_DEV as string,
      },
    },
    vimeo: {
      clientId: process.env.VIMEO_CLIENT_ID_DEV as string,
      token: process.env.VIMEO_TOKEN_DEV as string,
      clientSecret: process.env.VIMEO_CLIENT_SECRET_DEV as string,
    },
    mailchimp: {
      api: {
        apiKey: process.env.MAILCHIMP_API_KEY_DEV as string,
        serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX_DEV as string,
      },
      list: {
        name: process.env.MAILCHIMP_LIST_NAME_DEV as string,
      },
    },
    blocknative: {
      api: {
        url: 'https://api.blocknative.com',
        key: process.env.BLOCKNATIVE_API_KEY_DEV as string,
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
          'StandardCharity',
          'mainnet.json'
        ),
      },
    },
    ethereum: {
      wallet: process.env.ETH_WALLET_MNEMONIC_PROD
        ? mnemonicToWallet(process.env.ETH_WALLET_MNEMONIC_PROD as string)
        : null,
    },
    aws: {
      accessKey: process.env.AWS_ACCESS_KEY_ID_PROD as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROD as string,
      s3: {
        bucketName: process.env.S3_BUCKET_NAME_PROD as string,
        bucketUrl: process.env.S3_BUCKET_URL_PROD as string,
      },
    },
    vimeo: {
      clientId: process.env.VIMEO_CLIENT_ID_PROD as string,
      token: process.env.VIMEO_TOKEN_PROD as string,
      clientSecret: process.env.VIMEO_CLIENT_SECRET_PROD as string,
    },
    mailchimp: {
      api: {
        apiKey: process.env.MAILCHIMP_API_KEY_PROD as string,
        serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX_PROD as string,
      },
      list: {
        name: process.env.MAILCHIMP_LIST_NAME_PROD as string,
      },
    },
    blocknative: {
      api: {
        url: 'https://api.blocknative.com',
        key: process.env.BLOCKNATIVE_API_KEY_PROD as string,
      },
    },
  },
};

export default config;
