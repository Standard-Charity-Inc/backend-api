import Config from '../../config';

const config = Config[Config.env];

class ABI {
  standardCharityAbi: any;

  constructor() {
    try {
      this.standardCharityAbi = require(config.contracts.standardCharity
        .abiFilePath);
    } catch (e) {
      console.log('Error getting Standard Charity ABI:', e);
    }
  }
}

export default ABI;
