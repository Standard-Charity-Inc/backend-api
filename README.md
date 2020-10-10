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
    - [Get grouped donations](#get-grouped-donations)
  - [Expenditures](#expenditures)
    - [Get expenditures](#get-expenditures)
    - [Get total ETH expenditures](#get-total-eth-expenditures)
    - [Get total number of expenditures](#get-total-number-of-expenditures)
    - [Get plates deployed](#get-plates-deployed)
    - [Create expenditure](#create-expenditure)
  - [Expended donations](#expended-donations)
    - [Get expended donations](#get-expended-donations)
  - [Receipts](#receipts)
    - [Get donation receipt](#get-donation-receipt)
  - [Marketing](#marketing)
    - [Subscribe](#subscribe)
  - [Contract](#contract)
    - [Get contract balance](#get-contract-balance)

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
AWS_ACCESS_KEY_ID_DEV={AWS access key for development (needs full S3 permissions)}
AWS_SECRET_ACCESS_KEY_DEV={AWS secret access key for development (needs full S3 permissions)}
S3_BUCKET_NAME_DEV={S3 bucket name in the us-east-1 region for development}
S3_BUCKET_URL_DEV={URL for S3 bucket for development (e.g. behind Cloudfront)}
VIMEO_CLIENT_ID_DEV={Client ID for Vimeo API in development}
VIMEO_TOKEN_DEV={Generated token for Vimeo API in development}
VIMEO_CLIENT_SECRET_DEV={Client secret for Vimeo API in development}
MAILCHIMP_API_KEY_DEV={Mailchimp API key for development}
MAILCHIMP_SERVER_PREFIX_DEV={Mailchimp server prefix for development}
MAILCHIMP_LIST_NAME_DEV={Mailchimp list name for development}

# prod
INFURA_PROJECT_ID_PROD={Your Infura project ID for prduction}
INFURA_PROJECT_SECRET_PROD={Your Infura project secret for prduction}
STANDARD_CHARITY_CONTRACT_ADDRESS_PROD={Ethereum address of contract on mainnet}
ETH_WALLET_MNEMONIC_PROD={Mnemoic of the wallet that launched the contract on mainnet}
AWS_ACCESS_KEY_ID_PROD={AWS access key for production (needs full S3 permissions)}
AWS_SECRET_ACCESS_KEY_PROD={AWS secret access key for production (needs full S3 permissions)}
S3_BUCKET_NAME_PROD={S3 bucket name in the us-east-1 region for production}
S3_BUCKET_URL_PROD={URL for S3 bucket for production (e.g. behind Cloudfront)}
VIMEO_CLIENT_ID_PROD={Client ID for Vimeo API in production}
VIMEO_TOKEN_PROD={Generated token for Vimeo API in production}
VIMEO_CLIENT_SECRET_PROD={Client secret for Vimeo API in production}
MAILCHIMP_API_KEY_PROD={Mailchimp API key for production}
MAILCHIMP_SERVER_PREFIX_PROD={Mailchimp server prefix for production}
MAILCHIMP_LIST_NAME_PROD={Mailchimp list name for production}
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

  `pageSize: Int` Maximum of 100000

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

## Get grouped donations

Returns json array of donations gouped by a given element. Sorting is optional.

- **URL**

  /donations/grouped

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `page: Int`

  `pageSize: Int` Maximum of 100000

  `by: String` Must be one of: donator, value, numExpenditures, valueExpendedETH, valueExpendedUSD, valueRefundedETH

  **Optional:**

  `sortBy: String` Must be one of: totalValue, totalValueExpendedETH, totalValueExpendedUSD, totalValueRefundedETH, totalNumExpenditures

  `sortDir: String` Direction of the sort. Must be one of: asc, desc

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
     {
        "ok": true,
        "payload": {
          "groupedDonations": [
            {
              "donations": [
                {
                  "donator": "0x567157ffD7012c19f9bD900A9b280D839041acd4",
                  "value": "160000000000000000",
                  "timestamp": 1601685704,
                  "valueExpendedETH": "160000000000000000",
                  "valueExpendedUSD": 5664,
                  "valueRefundedETH": "0",
                  "donationNumber": 1,
                  "numExpenditures": 1
                }
              ],
              "donator": "0x567157ffD7012c19f9bD900A9b280D839041acd4",
              "totalValue": "160000000000000000",
              "totalValueExpendedETH": "160000000000000000",
              "totalValueExpendedUSD": 5664,
              "totalValueRefundedETH": "0",
              "totalNumExpenditures": 1
            },
            ...
          ],
          "total": 5
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
          message: 'There was a server error while fetching grouped donations',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(
    `${BASE_URL}/donations/grouped?page=1&pageSize=50&by=donator&sortBy=totalValue&sortDir=desc`
  );
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

  `pageSize: Int` Maximum of 100000

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

## Create expenditure

Creates an expenditure. NOTE: This function may only be called by the contract owner.

- **URL**

  /expenditures/create

- **Method:**

  `POST`

- **URL Params**

  **Required:**

  `message: String` Stringified JSON object. See example call.

  `signature: String` Signed message by contract owner's wallet. See example call.

- **Data Params**

  `attachment: Zip file` A zip file containing two files: a video (with extension .mp4, .mov, .wmv, .avi or .flv) and a receipt PDF (with extension .pdf)

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
      {
        "ok": true,
        "payload": {
          "videoHash": "2909569815",
          "vimeoUrl": "https://vimeo.com/454949147"
        },
        "error": null
      }
    ```

- **Error Response:**

  **Content:**

  ```javascript
    {
      "ok": false,
      "payload": null,
      "error": {
        message: '', // There are a wide variety of error messages that can be returned from this method
      }
    }
  ```

- **Sample Call:**

  ```javascript
  const web3 = new Web3()

  const accounts = await web3.eth.getAccounts()

  const message = JSON.stringify({
    platesDeployed: 10, // denoninated as *10, i.e. 50 = 5.0. The 10 value here represents 1 plate.
    usd: 2500 // in cents
  })

  const signature = await web3.eth.personal.sign(message, accounts[0], '');

  const res = await superagent
    .post(`${BASE_URL}/expenditures/create?message=${message}&signature=${signature}`)
    .attach('videoAndReceipt', 'path/to/somefile.zip'))
      // The file must be a zip file, and it must be named 'videoAndReceipt'
  ```

## Expended donations

Endpoints related to expenditures attributable to specific donations

## Get expended donations

Returns json array of expended donations

- **URL**

  /expendedDonations/all

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `page: Int`

  `pageSize: Int` Maximum of 100000

  **Optional:**

  `address: Int` ETH wallet address

  `donationNumber: Int` Specific donation number for address. Must be provided with address.

- **Data Params**

  None

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
      {
        "ok": true,
        "payload": {
          "expendedDonations": [
            {
              "expendedDonationNumber": 1,
              "donator": "0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40",
              "valueExpendedETH": "7155570000000000",
              "valueExpendedUSD": 337,
              "expenditureNumber": 1,
              "donationNumber": 2,
              "platesDeployed": 131.8
            }
          ],
          "total": 1
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
          message: 'There was a server error while fetching expended donations',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(
    `${BASE_URL}/expendedDonations/all?page=1&pageSize=50`
  );
  ```

## Receipts

Endpoints related to receipts

## Get donation receipt

Returns a URL to download a receipt for a given Ethereum address between two dates

- **URL**

  /receipts

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `beginTimestamp: Int` In milliseconds

  `endTimestamp: Int` In milliseconds

  `donorName: String` URL encoded name of donor

  `address: String` Ethereum address of donor

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
          "url": "https://assets.standardcharity.org/customerReceipts/tfAeQ9CA7hvQMjXGEJy66d.pdf"
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
          message: '', // A wide variety of error messages may be returned from this endpoint
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(
    `${BASE_URL}/receipts?beginTimestamp=1578098293000&endTimestamp=1599192440000&donorName=Fred%20Jones&address=0x7D6c6B479b247f3DEC1eDfcC4fAf56c5Ff9A5F40`
  );
  ```

## Marketing

Endpoints related to marketing

## Subscribe

Subscribe an individual to Mailchimp

- **URL**

  /marketing/createSubscriber

- **Method:**

  `POST`

- **URL Params**

  **Required:**

  None

- **Data Params**

  `firstName: String`

  `lastName: String`

  `email: String`

- **Success Response:**

  - **Status code:** 200

    **Content:**

    ```javascript
      {
        "ok": true,
        "payload": null,
        "error": null
      }
    ```

- **Error Response:**

  **Content:**

  ```javascript
    {
      "ok": false,
      "payload": null,
      "error": {
        message: '', // There are a wide variety of error messages that can be returned from this method -- many from Mailchimp directly
      }
    }
  ```

- **Sample Call:**

  ```javascript
  const res = await superagent
    .post(`${BASE_URL}/marketing/createSubscriber`)
    .send({
      firstName: 'Fred',
      lastName: 'Jones',
      email: 'fred@yopmail.com',
    });
  ```

## Contract

Endpoints related to the contract

## Get contract balance

Returns json data about the contract's current balance denominated in wei

- **URL**

  /contract/balance

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
          "contractBalance": "200000000000000000" // in wei
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
          message: 'There was a server error while fetching the contract balance',
        }
      }
    ```

- **Sample Call:**

  ```javascript
  const res = await superagent.get(`${BASE_URL}/contract/balance`);
  ```
