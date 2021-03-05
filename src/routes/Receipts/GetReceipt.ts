import { Response } from 'express';
import { filter } from 'lodash';

import StandardRoute from '../StandardRoute';
import { DateTime } from 'luxon';
import Redis from '../../redis';
import Receipt from '../../utils/PDFs/Receipt';

interface IRequestParams {
  beginTimestamp: number;
  endTimestamp: number;
  donorName: string;
  address: string;
}

class GetReceipt extends StandardRoute {
  init = async (): Promise<Response> => {
    try {
      const { beginTimestamp, endTimestamp, donorName, address } = (this.req
        .query as unknown) as IRequestParams;

      if (
        !beginTimestamp ||
        isNaN(beginTimestamp) ||
        !DateTime.fromMillis(Number(beginTimestamp)).isValid
      ) {
        return this.sendResponse(false, 400, null, {
          message: 'The beginTimestamp must be a timestamp in milliseconds',
        });
      }

      if (
        !endTimestamp ||
        isNaN(endTimestamp) ||
        !DateTime.fromMillis(Number(endTimestamp)).isValid
      ) {
        return this.sendResponse(false, 400, null, {
          message: 'The endTimestamp must be a timestamp in milliseconds',
        });
      }

      if (!donorName) {
        return this.sendResponse(false, 400, null, {
          message: 'A donorName must be provided',
        });
      }

      if (!address) {
        return this.sendResponse(false, 400, null, {
          message: 'An ethereum address for the donor must be provided',
        });
      }

      const redis = new Redis();

      const allDonations = await redis.getAllDonations();

      let totalCentsExpended = 0;

      allDonations.map((donation) => {
        const timestampMilli = donation.timestamp * 1000;

        if (
          donation.donator === address &&
          timestampMilli > beginTimestamp &&
          timestampMilli < endTimestamp
        ) {
          totalCentsExpended += donation.valueExpendedUSD;
        }
      });

      if (totalCentsExpended === 0) {
        return this.sendResponse(false, 400, null, {
          message:
            'No donations could be found for the address, beginning date and ending date provided',
        });
      }

      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const dollars = formatter
        .format(totalCentsExpended / 100)
        .replace('$', '');

      const url = await new Receipt(
        dollars,
        Number(beginTimestamp),
        Number(endTimestamp),
        address,
        decodeURIComponent(donorName)
      ).init();

      if (!url) {
        return this.sendResponse(false, 500, null, {
          message: 'A PDF could not be generated for a receipt',
        });
      }

      return this.sendResponse(true, 200, { url }, null);
    } catch (e) {
      console.log('GetReceipt error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while creating a receipt',
      });
    }
  };
}

export default GetReceipt;
