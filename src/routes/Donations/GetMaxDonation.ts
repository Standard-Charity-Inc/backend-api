import { Response } from 'express';
import validator from 'validator';
import { orderBy, slice } from 'lodash';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';

class GetMaxDonation extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const { count } = this.req.query;

      if (count && !validator.isInt(count.toString())) {
        return this.sendResponse(false, 400, null, {
          message:
            'Although the count parameter is optional, if provided, it must be of type integer',
        });
      }

      let numberToReturn = 1;

      if (count) {
        numberToReturn = Number(count) < 25 ? Number(count) : 25;
      }

      const allDonations = orderBy(
        await new Redis().getAllDonations(),
        (o) => Number(o.value),
        'desc'
      );

      return this.sendResponse(
        true,
        200,
        slice(allDonations, 0, numberToReturn),
        null
      );
    } catch (e) {
      console.log('GetMaxDonation error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching the maximum donation',
      });
    }
  };
}

export default GetMaxDonation;
