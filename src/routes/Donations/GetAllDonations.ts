import { Response } from 'express';
import { orderBy, slice, filter } from 'lodash';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';
import { getPageStartEnd } from '../../utils';

class GetAllDonations extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const { page, pageSize, address } = this.req.query;

      const { error, start, end } = getPageStartEnd(page, pageSize);

      if (error) {
        return this.sendResponse(false, 400, null, {
          message: error,
        });
      }

      const allDonations = orderBy(
        await new Redis().getAllDonations(),
        (o) => o.timestamp
      );

      const donations = address
        ? filter(
            allDonations,
            (o) => o.donator.toLowerCase() === address.toString().toLowerCase()
          )
        : allDonations;

      return this.sendResponse(
        true,
        200,
        {
          donations: slice(donations, start, end),
          total: donations.length,
        },
        null
      );
    } catch (e) {
      console.log('GetAllDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching donations',
      });
    }
  };
}

export default GetAllDonations;
