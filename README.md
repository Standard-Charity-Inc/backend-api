# Backend API

> Backend resources for Standard Charity

**⚠️ This API is under development. It is not ready for production deployment.**

This Node.js/Express API, written in Typescript, is the primary backend package for Standard Charity.

You'll need [Node.js](https://nodejs.org/en/download/) installed.

You'll also need [Redis](https://redis.io/) installed, and an instance of Redis server running.

- [Setup](#setup)
  - [Install dependencies](#install-dependencies)
  - [Get an Infura account](#get-an-infura-account)
  - [Create a .env file](#create-a-.env-file)
- [Usage](#usage)
  - [Development mode](#development-mode)
  - [Production mode](#production-mode)
- [Endpoints](#endpoints)
  - [Donations](#donations)
    - [Get donations](#get-donations)
    - [Get maximum donation](#get-maximum-donation)
    - [Get latest donation](#get-latest-donation)
    - [Get total ETH donations](#get-total-eth-donations)
    - [Get total number of donations](#get-total-number-of-donations)
  - [Expenditures](#expenditures)
    - [Get expenditures](#get-expenditures)
    - [Get total ETH expenditures](#get-total-eth-expenditures)
    - [Get total number of expenditures](#get-total-number-of-expenditures)
    - [Get plates deployed](#get-plates-deployed)

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

## Get donations

Returns json array of donations

- **URL**

  /donations/all

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `page: Int`

  `pageSize: Int` Maximum of 100

  **Optional:**

  `address: Int` ETH wallet address

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
      {
        "ok": true,
        "payload": {
          "donations": [
            {
              "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
              "value": "200000000000000000", // in wei
              "timestamp": 1598317668,
              "valueExpendedETH": "0", // in wei
              "valueExpendedUSD": 0, // in cents
              "valueRefundedETH": "0", // in wei
              "donationNumber": 1, // for this address
              "numExpenditures": 0
            }
          ],
          "total": 1 // count of donations, ignoring page and pageSize
        },
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
          message: 'There was a server error while fetching donations',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(
    `${BASE_URL}/donations/all?page=1&pageSize=50`
  );
  ```

## Get maximum donation

Returns json data about the contract's top donation, if any donations exist at all

- **URL**

  /donations/max

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

  **Optional:**

  `count: Int` The number of top donations to return (up to 25)

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    If a maximum donation(s) exists:

    ```javascript
      {
        "ok": true,
        "payload": [
          {
            "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
            "value": "350000000000000000", // in wei
            "timestamp": 1598490278,
            "valueExpendedETH": "0", // in wei
            "valueExpendedUSD": 0, // in cents
            "valueRefundedETH": "0", // in wei
            "donationNumber": 3,
            "numExpenditures": 0
          },
          {
            "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
            "value": "200000000000000000", // in wei
            "timestamp": 1598317668,
            "valueExpendedETH": "0", // in wei
            "valueExpendedUSD": 0, // in cents
            "valueRefundedETH": "0", // in wei
            "donationNumber": 1,
            "numExpenditures": 0
          },
        ],
        "error": null
      }
    ```

    If a maximum donation does not exist, i.e. there are no donations:

    ```javascript
      {
        "ok": true,
        "payload": [],
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
  const res = await superagent.get(`${BASE_URL}/donations/max?count=10`);
  ```

## Get latest donation

Returns json data about the contract's most recent donation, if any donations exist at all

- **URL**

  /donations/latest

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

    If a latest donation exists:

    ```javascript
      {
        "ok": true,
        "payload": {
          "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
          "value": "2c68af0bb140000", // in wei
          "timestamp": 1598317668
        },
        "error": null
      }
    ```

    If a latest donation does not exist, i.e. there are no donations at all:

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
          message: 'There was a server error while fetching the latest donation',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/donations/latest`);
  ```

## Get total ETH donations

Returns json data about the contract's overall value of donations received denomiated in wei

- **URL**

  /donations/totalEth

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

    ```javascript
      {
        "ok": true,
        "payload": {
          "totalDonationsEth": "200000000000000000" // in wei
        },
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
          message: 'There was a server error while fetching total donations denominated in ETH',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/donations/totalEth`);
  ```

## Get total number of donations

Returns json data about the total count of donations to the contract

- **URL**

  /donations/totalNumber

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

    ```javascript
      {
        "ok": true,
        "payload": {
          "totalNumDonations": 1
        },
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
          message: 'There was a server error while fetching the total number of donations',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/donations/totalNumber`);
  ```

## Expenditures

Endpoints related to expenditures

## Get expenditures

Returns json array of expenditures

- **URL**

  /expenditures/all

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `page: Int`

  `pageSize: Int` Maximum of 100

  **Optional:**

  None

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
      {
        "ok": true,
        "payload": {
          "expenditures": [
            {
              "expenditureNumber": 1,
              "valueExpendedETH": "50000000000000000", // in wei
              "valueExpendedUSD": 1055, // in cents
              "videoHash": "abc",
              "receiptHash": "def",
              "timestamp": 1598491778,
              "numExpendedDonations": 0,
              "valueExpendedByDonations": "0", // in wei
              "platesDeployed": 4
            },
            {
              "expenditureNumber": 2,
              "valueExpendedETH": "40000000000000000", // in wei
              "valueExpendedUSD": 950, // in cents
              "videoHash": "abc",
              "receiptHash": "def",
              "timestamp": 1598492633,
              "numExpendedDonations": 0,
              "valueExpendedByDonations": "0", // in wei
              "platesDeployed": 3
            }
          ],
          "total": 2
        },
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
          message: 'There was a server error while fetching expenditures',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(
    `${BASE_URL}/expenditures/all?page=1&pageSize=50`
  );
  ```

## Get total ETH expenditures

Returns json data about the contract's overall value of expenditures denomiated in wei

- **URL**

  /expenditures/totalEth

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

    ```javascript
      {
        "ok": true,
        "payload": {
          "totalExpendedEth": "50000000000000000" // in wei
        },
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
          message: 'There was a server error while fetching total expenditures denominated in ETH',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/expenditures/totalEth`);
  ```

## Get total number of expenditures

Returns json data about the total count of expenditures from the contract

- **URL**

  /expenditures/totalNumber

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

    ```javascript
      {
        "ok": true,
        "payload": {
          "totalNumExpenditures": 1
        },
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
          message: 'There was a server error while fetching the total number of expenditures',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/expenditures/totalNumber`);
  ```

## Get plates deployed

Returns json data about the total number of plates deployed and average price per plate in USD

- **URL**

  /expenditures/plates

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

    ```javascript
      {
        "ok": true,
        "payload": {
          "platesDeployed": 10,
          "pricePerPlateUsd": "10.05"
        },
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
          message: 'There was a server error while fetching plates deployed',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/expenditures/plates`);
  ```
