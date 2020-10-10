import { Response } from 'express';
import { orderBy, slice, groupBy, values } from 'lodash';
import BN from 'bn.js';

import StandardRoute from '../StandardRoute';
import Redis from '../../redis';
import { getPageStartEnd } from '../../utils';
import { IDonation } from '../../types';

interface IGroupedDonation {
  donations: IDonation[];
  donator: string;
  totalValue: string;
  totalValueExpendedETH: string;
  totalValueExpendedUSD: number;
  totalValueRefundedETH: string;
  totalNumExpenditures: number;
}

class GetDonationsGroupedBy extends StandardRoute {
  public init = async (): Promise<Response> => {
    try {
      const { page, pageSize, by, sortBy, sortDir } = this.req.query;

      if (!by) {
        return this.sendResponse(false, 400, null, {
          message: 'A by value must be provided in the request',
        });
      }

      const { error, start, end } = getPageStartEnd(page, pageSize);

      const allowableSorters = [
        'donator',
        'value',
        'numExpenditures',
        'valueExpendedETH',
        'valueExpendedUSD',
        'valueRefundedETH',
      ];

      if (!allowableSorters.includes(`${by}`)) {
        return this.sendResponse(false, 400, null, {
          message: `Only the following values may be provided as a value for by: ${allowableSorters.join(
            ', '
          )}`,
        });
      }

      if (error) {
        return this.sendResponse(false, 400, null, {
          message: error,
        });
      }

      const allDonations = orderBy(
        await new Redis().getAllDonations(),
        (o) => o.timestamp
      );

      const grouped = groupBy(allDonations, by);

      let donations: Partial<IGroupedDonation>[] = [];

      values(grouped).map((donationArray: any[]) => {
        const item: IDonation[] = donationArray as IDonation[];

        let totalValue = new BN('0');
        let totalValueExpendedETH = new BN('0');
        let totalValueExpendedUSD = 0;
        let totalValueRefundedETH = new BN('0');
        let totalNumExpenditures = 0;

        const finalDonation: Partial<IGroupedDonation> = {
          donations: item,
          donator: item[0].donator,
        };

        item.map((donation: IDonation) => {
          totalValue = totalValue.add(new BN(donation.value));

          totalValueExpendedETH = totalValueExpendedETH.add(
            new BN(donation.valueExpendedETH)
          );

          totalValueExpendedUSD += donation.valueExpendedUSD;

          totalValueRefundedETH = totalValueRefundedETH.add(
            new BN(donation.valueRefundedETH)
          );

          totalNumExpenditures += donation.numExpenditures;
        });

        finalDonation.totalValue = totalValue.toString();

        finalDonation.totalValueExpendedETH = totalValueExpendedETH.toString();

        finalDonation.totalValueExpendedUSD = totalValueExpendedUSD;

        finalDonation.totalValueRefundedETH = totalValueRefundedETH.toString();

        finalDonation.totalNumExpenditures = totalNumExpenditures;

        donations.push(finalDonation);
      });

      const allowableSortBys = [
        'totalValue',
        'totalValueExpendedETH',
        'totalValueExpendedUSD',
        'totalValueRefundedETH',
        'totalNumExpenditures',
      ];

      const allowableSortDirs = ['asc', 'desc'];

      if (sortBy) {
        if (!allowableSortBys.includes(`${sortBy}`)) {
          return this.sendResponse(false, 400, null, {
            message: `The sortBy value must be one of the following: ${allowableSortBys.join(
              ', '
            )}`,
          });
        }

        if (sortDir && !allowableSortDirs.includes(`${sortDir}`)) {
          return this.sendResponse(false, 400, null, {
            message: `The sortDir value must be one of the following: ${allowableSortDirs.join(
              ', '
            )}`,
          });
        }

        donations = orderBy(
          donations,
          // @ts-ignore
          (o) => Number(o[sortBy]),
          // @ts-ignore
          sortDir || 'desc'
        );
      }

      return this.sendResponse(
        true,
        200,
        {
          groupedDonations: slice(donations, start, end),
          total: donations.length,
        },
        null
      );
    } catch (e) {
      console.log('GetAllDonations error:', e);

      return this.sendResponse(false, 500, null, {
        message: 'There was a server error while fetching grouped donations',
      });
    }
  };
}

export default GetDonationsGroupedBy;
