import { Response } from 'express';
import { orderBy, slice, filter } from 'lodash';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';
import { getPageStartEnd } from '../../utils';

class GetAllExpenditures extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const {
        page,
        pageSize,
        startAtTimestamp,
        endAtTimestamp,
      } = this.req.query;

      const { error, start, end } = getPageStartEnd(page, pageSize);

      if (error) {
        return this.sendResponse(false, 400, null, {
          message: error,
        });
      }

      let expenditures = orderBy(
        await new Redis().getAllExpenditures(),
        (o) => o.timestamp
      );

      if (startAtTimestamp) {
        if (isNaN(Number(startAtTimestamp))) {
          return this.sendResponse(false, 400, null, {
            message: 'The startAtTimestamp value must be an integer',
          });
        }

        expenditures = filter(
          expenditures,
          (o) => o.timestamp >= Number(startAtTimestamp)
        );
      }

      if (endAtTimestamp) {
        if (isNaN(Number(endAtTimestamp))) {
          return this.sendResponse(false, 400, null, {
            message: 'The endAtTimestamp value must be an integer',
          });
        }

        expenditures = filter(
          expenditures,
          (o) => o.timestamp <= Number(endAtTimestamp)
        );
      }

      return this.sendResponse(
        true,
        200,
        {
          expenditures: slice(expenditures, start, end),
          total: expenditures.length,
        },
        null
      );
    } catch (e) {
      console.log('GetAllExpenditures error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching expenditures',
      });
    }
  };
}

export default GetAllExpenditures;
