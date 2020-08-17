export interface IDonation {
  donator: string;
  value: number;
  timestamp: number;
  valueExpendedETH: number;
  valueExpendedUSD: number;
  valueRefundedETH: number;
  donationNumber: number;
  // mapping (uint256 => uint256) expendedDonationIDs;
  numExpenditures: number;
}

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
  | 'isTextEmpty';
