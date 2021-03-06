import AWS from 'aws-sdk';

import Config from '../config';
import { ReadStream } from 'fs';

const config = Config[Config.env];

export const uploadToS3 = async (
  Key: string,
  Body: string | Buffer | Blob | ReadStream,
  ContentEncoding?: string | undefined,
  ContentType?: string
): Promise<boolean> => {
  try {
    return new Promise(async (resolve) => {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: config.aws.s3.bucketName,
        Key,
        ACL: 'public-read',
        Body,
        ContentEncoding,
        ContentType,
      };

      new AWS.S3().putObject(params, (err, data) => {
        if (err) {
          console.log('Error while uploading to S3:', err);

          return resolve(false);
        }

        resolve(true);
      });
    });
  } catch (e) {
    console.log('uploadToS3 error:', e);

    return false;
  }
};
