import superagent from 'superagent';

class CoinGecko {
  getEthPrice = async (): Promise<number | null> => {
    try {
      const res = await superagent
        .get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        )
        .set({
          accept: 'application/json',
        });

      if (
        !res ||
        !res.body ||
        !res.body.ethereum ||
        !res.body.ethereum.usd ||
        isNaN(res.body.ethereum.usd)
      ) {
        console.log('getEthPrice response was invalid:', res);

        return null;
      }

      return res.body.ethereum.usd;
    } catch (e) {
      console.log('getEthPrice error:', e);

      return null;
    }
  };
}

export default CoinGecko;
