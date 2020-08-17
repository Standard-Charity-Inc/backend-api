# Backend API

> Backend resources for Standard Charity

**⚠️ This API is under development. It is not ready for production deployment.**

This Node.js/Express API, written in Typescript, is the primary backend package for Standard Charity.

You'll need [Node.js](https://nodejs.org/en/download/) installed.

## Setup

Before running the API, take care of the following.

### Intall dependencies

After cloning the repo, run `npm install` in the project's root directory.

### Get an Infura account

You will need an [Infura](https://infura.io/) account for the Infura-related environment variables.

### Create a .env file

In the root directory of the project, create a .env file. Inside that file, add the following:

```
# dev
INFURA_PROJECT_ID_DEV={Your Infura project ID for development}
INFURA_PROJECT_SECRET_DEV={Your Infura project secret for development}
STANDARD_CHARITY_CONTRACT_ADDRESS_DEV={Ethereum address of contract on Rinkeby testnet}
ETH_WALLET_MNEMONIC_DEV={Mnemoic of the wallet that launched the contract on the Rinkeby testnet}

# prod
INFURA_PROJECT_ID_PROD={Your Infura project ID for prduction}
INFURA_PROJECT_SECRET_PROD={Your Infura project secret for prduction}
STANDARD_CHARITY_CONTRACT_ADDRESS_PROD={Ethereum address of contract on mainnet}
ETH_WALLET_MNEMONIC_PROD={Mnemoic of the wallet that launched the contract on mainnet}
```

Replace the items in brackets (`{}`), including the brackets themselves. For Infura-related items, create a project in Infura, and get the ID and secret from the `Keys` section in your project's settings.

The values for `dev` and `prod` may be the same.

## Usage

Once you've completed setup, you're ready to run the API.

### Development mode

Run `npm run dev`.

API endpoints will be exposed at `localhost:3001`.

### Production mode

Run `npm run prod`.

API endpoints will be exposed on port 3002.
