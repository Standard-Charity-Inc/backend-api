import BN from 'bn.js';

import { ContractEventName } from '../Infura/StandardCharity/ContractEvents';

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
  | 'totalExpendedUSD'
  | 'totalPlatesDeployed'
  | ContractEventName;

export interface ISpotlightDonation {
  donator: string;
  value: string;
  timestamp: number;
}

export interface IDonationTrackerItem {
  overallDonationNum: number;
  addressDonationNum: number;
  address: string;
}

export interface IDonation {
  donator: string;
  value: string;
  timestamp: number;
  valueExpendedETH: string;
  valueExpendedUSD: number;
  valueRefundedETH: string;
  donationNumber: number;
  numExpenditures: number;
}

export interface IExpenditure {
  expenditureNumber: number;
  valueExpendedETH: string;
  valueExpendedUSD: number;
  videoHash: string;
  receiptHash: string;
  timestamp: number;
  numExpendedDonations: number;
  valueExpendedByDonations: string;
  platesDeployed: number;
}

export interface IExpendedDonation {
  expendedDonationNumber: number;
  donator: string;
  valueExpendedETH: string;
  valueExpendedUSD: number;
  expenditureNumber: number;
  donationNumber: number;
  platesDeployed: number;
}

export interface IPendingExpendedDonation {
  donator: string;
  valueExpendedETH: BN | string;
  valueExpendedUSD: number;
  donationNumber: number;
  expenditureNumber: number;
  platesDeployed: number;
}

export interface IPendingRefund {
  address: string;
  donationNumber: number;
  valueETHToRefund: string;
}
