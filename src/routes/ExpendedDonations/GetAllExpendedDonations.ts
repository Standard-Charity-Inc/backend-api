import { Response } from 'express';
import { orderBy, slice, filter } from 'lodash';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';
import { getPageStartEnd } from '../../utils';

class GetAllExpendedDonations extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const { page, pageSize, address, donationNumber } = this.req.query;

      const { error, start, end } = getPageStartEnd(page, pageSize);

      if (error) {
        return this.sendResponse(false, 400, null, {
          message: error,
        });
      }

      const allExpendedDonations = orderBy(
        await new Redis().getAllExpendedDonations(),
        (o) => o.expendedDonationNumber
      );

      let expendedDonations = address
        ? filter(
            allExpendedDonations,
            (o) => o.donator.toLowerCase() === address.toString().toLowerCase()
          )
        : allExpendedDonations;

      if (address && donationNumber) {
        if (isNaN(Number(donationNumber))) {
          return this.sendResponse(false, 400, null, {
            message: 'The donation number must be an integer',
          });
        }

        expendedDonations = filter(
          expendedDonations,
          (o) => o.donationNumber === Number(donationNumber)
        );
      }

      return this.sendResponse(
        true,
        200,
        {
          expendedDonations: slice(expendedDonations, start, end),
          total: expendedDonations.length,
        },
        null
      );
    } catch (e) {
      console.log('GetAllExpendedDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching expended donations',
      });
    }
  };
}

export default GetAllExpendedDonations;
