# Backend API

> Backend resources for Standard Charity

**⚠️ This API is under development. It is not ready for production deployment.**

This Node.js/Express API, written in Typescript, is the primary backend package for Standard Charity.

You'll need [Node.js](https://nodejs.org/en/download/) installed.

- [Setup](#setup)
  - [Install dependencies](#install-dependencies)
  - [Get an Infura account](#get-an-infura-account)
  - [Create a .env file](#create-a-.env-file)
- [Usage](#usage)
  - [Development mode](#development-mode)
  - [Production mode](#production-mode)
- [Endpoints](#endpoints)
  - [Donations](#donations)
    - [Get maximum donation](#get-maximum-donation)

## Setup

Before running the API, take care of the following.

### Install dependencies

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

# Endpoints

For development, the base URL for the Standard Charity API is:

```
https://api-dev.standardcharity.org/
```

For production, the base URL for the Standard Charity API is:

```
https://api.standardcharity.org/
```

If you're forking this repo to create your own API, your base URLs would of course be different.

All endpoints return a response of the following format:

```typescript
interface IResponse {
  ok: boolean;
  payload: { [key: string]: any } | null;
  error: IError | null;
}
```

where IError is defined as:

```typescript
interface IError {
  message: string;
}
```

## Donations

Endpoints related to donations

## Get maximum donation

Returns json data about the contract's top donation, if any donations exist at all

- **URL**

  /donations/max

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    If a maximum donation exists:

    ```javascript
      {
        "ok": true,
        "payload": {
          "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
          "value": "2c68af0bb140000",
          "timestamp": 1598317668
        },
        "error": null
      }
    ```

    If a maximum donation does not exist:

    ```javascript
      {
        "ok": true,
        "payload": null,
        "error": null
      }
    ```

- **Error Response:**

  - **Code:** 500 SERVER ERROR

    **Content:**

    ```javascript
      {
        "ok": false,
        "payload": null,
        "error": {
          message: 'There was a server error while fetching the maximum donation',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/donations/max`);
  ```
