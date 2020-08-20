import BN from 'bn.js';

export type ContractFunctionName =
  | 'donate'
  | 'createExpenditure'
  | 'setNextDonationToExpend'
  | 'createExpendedDonation'
  | 'getExpendedDonationIDForDonation'
  | 'getExpendedDonationIDForExpenditure'
  | 'refundDonation'
  | 'toAsciiString'
  | 'concat'
  | 'getTotalNumDonations'
  | 'getTotalNumExpenditures'
  | 'getTotalNumExpendedDonations'
  | 'getContractBalance'
  | 'isTextEmpty'
  | 'maxDonation'
  | 'latestDonation'
  | 'donations'
  | 'donationTracker'
  | 'expenditures'
  | 'expendedDonations'
  | 'nextDonationToExpend'
  | 'totalDonationsETH'
  | 'totalExpendedETH'
  | 'totalExpendedUSD';

export interface ISpotlightDonation {
  donator: string;
  value: BN;
  timestamp: number;
}

export interface IDonationTrackerItem {
  overallDonationNum: number;
  addressDonationNum: number;
  address: string;
}

export interface IDonation {
  donator: string;
  value: BN;
  timestamp: number;
  valueExpendedETH: BN;
  valueExpendedUSD: number;
  valueRefundedETH: BN;
  donationNumber: number;
  // mapping (uint256 => uint256) expendedDonationIDs;
  numExpenditures: number;
}

export interface IExpenditure {
  expenditureNumber: number;
  valueExpendedETH: BN;
  valueExpendedUSD: number;
  videoHash: string;
  receiptHash: string;
  timestamp: number;
  // mapping (uint256 => uint256) expendedDonationIDs;
  numExpendedDonations: number;
  valueExpendedByDonations: BN;
}
