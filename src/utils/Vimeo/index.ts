import { Vimeo as VimeoPackage } from 'vimeo';

import Config from '../../config';

const config = Config[Config.env];

class Vimeo {
  vimeo: VimeoPackage;

  constructor() {
    this.vimeo = new VimeoPackage(
      config.vimeo.clientId,
      config.vimeo.clientSecret,
      config.vimeo.token
    );
  }

  upload = async (
    path: string,
    name: string
  ): Promise<{ uri?: string; error?: string }> => {
    try {
      return new Promise((resolve) => {
        this.vimeo.upload(
          path,
          {
            name,
            description:
              'Standard Charity, a 501(c)(3) non-profit organization, utilizies the power of the blockchain to feed those in need. He us feed the hungry by donating Ethereum at https://standardcharity.org.',
          },
          (uri) => {
            console.log('Video uri:', uri);

            resolve({
              uri,
            });
          },
          (bytes_uploaded, bytes_total) => {
            const percentage = ((bytes_uploaded / bytes_total) * 100).toFixed(
              2
            );

            console.log('Percentage uploaded to Vimeo:', percentage);
          },
          (error) => {
            console.log('Vimeo upload error:', error);

            resolve({
              error,
            });
          }
        );
      });
    } catch (e) {
      console.log('Vimeo upload error:', e);

      return {
        error: 'Could not upload video to Vimeo',
      };
    }
  };
}

export default Vimeo;
