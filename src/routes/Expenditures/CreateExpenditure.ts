import { Response } from 'express';
import AdmZip from 'adm-zip';
import shortUuid from 'short-uuid';
import { extname, basename, join } from 'path';
import { find, filter } from 'lodash';
import * as xxhash from 'xxhash';
import { readFileSync, unlink, readdir, lstatSync } from 'fs';
import BN from 'bn.js';
import rimraf from 'rimraf';

import StandardRoute, { IError } from '../StandardRoute';
import { isMessageVerified, ethToWei } from '../../utils/ethereum';
import Config from '../../config';
import Infura from '../../Infura';
import CoinGecko from '../../utils/CoinGecko';
import Redis from '../../redis';
import { uploadToS3 } from '../../utils/s3';

const config = Config[Config.env];

interface IUnzippedFile {
  name: string;
  extension: string;
  type: 'video' | 'receipt';
  hash: number;
}

interface IUinzipFileRes {
  unzippedFiles: IUnzippedFile[];
  tmpDirPath: string;
}

interface IRequestBody {
  message?: string;
  signature?: string;
}

interface IRequestMessage {
  platesDeployed: number;
  usd: string;
}

class CreateExpenditure extends StandardRoute {
  infura?: Infura;
  redis?: Redis;
  expenditureWei?: BN;
  expenditureUsd?: number;
  expenditurePlatesDeployed?: number;

  public init = async (): Promise<Response> => {
    try {
      this.infura = new Infura();

      this.redis = new Redis();

      if (await this.redis.getIsCreatingExpenditure()) {
        return this.sendResponse(false, 400, null, {
          message:
            'The system is processing a previous expenditure. Please try again in a few minutes.',
        });
      }

      if (await this.redis.getIsCreatingRefunds()) {
        return this.sendResponse(false, 400, null, {
          message:
            'The system is processing refunds. Please try again in a few minutes.',
        });
      }

      await this.redis.setIsCreatingExpenditure(true);

      const { files } = this.req;

      if (!files || Object.keys(files).length === 0) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'No files were included with the request',
        });
      }

      const params: IRequestBody = this.req.query;

      if (!params.message) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'Param message was not included in request',
        });
      }

      if (!params.signature) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'Param signature was not included in request',
        });
      }

      if (!config.ethereum.wallet) {
        return this.sendExpenditureError(false, 500, null, {
          message:
            'There was a server error while creating expenditure: could not get ETH wallet',
        });
      }

      const isVerified = isMessageVerified(
        params.message,
        params.signature,
        config.ethereum.wallet.address
      );

      if (!isVerified) {
        return this.sendExpenditureError(false, 400, null, {
          message:
            'The message and signature provided could not be verified. Only the address of the contract owner can be used to sign the message.',
        });
      }

      let parsedMessage: IRequestMessage | null = null;

      try {
        parsedMessage = JSON.parse(params.message);
      } catch (e) {
        console.log('parse message error in CreateExpenditure:', e);
      }

      if (!parsedMessage) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'The message provided in the request could not be parsed',
        });
      }

      if (
        !parsedMessage.platesDeployed ||
        isNaN(Number(parsedMessage.platesDeployed))
      ) {
        return this.sendExpenditureError(false, 400, null, {
          message:
            'The platesDeployed value in the message was not provided or was invalid',
        });
      }

      this.expenditurePlatesDeployed = Number(parsedMessage.platesDeployed);

      if (!parsedMessage.usd || isNaN(Number(parsedMessage.usd))) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'The usd in the message was not provided or was invalid',
        });
      }

      this.expenditureUsd = Number(parsedMessage.usd);

      const videoAndReceiptFile: any = files.videoAndReceipt;

      if (!videoAndReceiptFile || !videoAndReceiptFile.tempFilePath) {
        return this.sendExpenditureError(false, 400, null, {
          message:
            'A zipped file named videoAndReceipt that contains a video file and receipt PDF must be included in the request',
        });
      }

      const ethPrice = await new CoinGecko().getEthPrice();

      if (!ethPrice) {
        return this.sendExpenditureError(false, 500, null, {
          message:
            'A server error occured while creating the expenditure. Could not get the ETH price.',
        });
      }

      const ethExpended = this.expenditureUsd / 100 / ethPrice;

      const expenditureWei = ethToWei(ethExpended.toString());

      if (!expenditureWei || !expenditureWei.toString()) {
        return this.sendExpenditureError(false, 500, null, {
          message:
            'Could not convert ETH to wei for the purpose of creating the expenditure',
        });
      }

      this.expenditureWei = expenditureWei;

      const unzipFileRes = await this.unzipFile(
        videoAndReceiptFile.tempFilePath
      );

      if (typeof unzipFileRes === 'string') {
        return this.sendExpenditureError(false, 400, null, {
          message: unzipFileRes,
        });
      }

      const { unzippedFiles } = unzipFileRes;

      if (!unzippedFiles) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'Could not unzip file to create expenditure',
        });
      }

      const videoFile = find(unzippedFiles, (o) => o.type === 'video');

      if (!videoFile) {
        return this.sendExpenditureError(false, 500, null, {
          message: 'The video file could not be parsed',
        });
      }

      const receiptFile = find(unzippedFiles, (o) => o.type === 'receipt');

      if (!receiptFile) {
        return this.sendExpenditureError(false, 500, null, {
          message: 'The receipt file could not be parsed',
        });
      }

      const receiptUploaded = await uploadToS3(
        `receipts/${receiptFile.hash}.pdf`,
        readFileSync(`${unzipFileRes.tmpDirPath}/${receiptFile.name}`)
      );

      if (!receiptUploaded) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'The receipt could not be uploaded to S3',
        });
      }

      // TO DO: Upload video file here

      const contractBalance = await this.redis.getStandardCharityContractBalance();

      if (new BN(contractBalance).sub(this.expenditureWei).lt(new BN(0))) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'You may not expend more than the balance of the contract',
        });
      }

      const expenditureCreated = await this.infura.createExpenditure(
        videoFile.hash.toString(),
        receiptFile.hash.toString(),
        this.expenditureUsd,
        this.expenditureWei,
        this.expenditurePlatesDeployed
      );

      console.log('expenditureCreated:', expenditureCreated);

      if (!expenditureCreated) {
        return this.sendExpenditureError(false, 400, null, {
          message: 'The expenditure could not be created via Infura',
        });
      }

      await this.deleteAllTempFiles();

      return this.sendResponse(true, 200, null, null);
    } catch (e) {
      console.log('CreateExpenditure error:', e);

      return this.sendExpenditureError(false, 500, null, {
        message: 'There expenditure could not be created',
      });
    }
  };

  unzipFile = async (path: string): Promise<IUinzipFileRes | string> => {
    const acceptableVideoExts = ['.mp4', '.mov', '.wmv', '.avi', '.flv'];

    try {
      const zip = new AdmZip(path);

      const zipEntries = zip.getEntries();

      const unzippedFiles: IUnzippedFile[] = [];

      const acceptableFileExts = [...acceptableVideoExts, '.pdf'];

      const tmpDirPath = `${__dirname}/tmp/${shortUuid.generate()}`;

      zip.extractAllTo(tmpDirPath);

      zipEntries.map(async (zipEntry) => {
        if (basename(zipEntry.entryName).startsWith('.')) {
          return;
        }

        const extension = extname(zipEntry.entryName).toLowerCase();

        if (!acceptableFileExts.includes(extension)) {
          return;
        }

        const file = readFileSync(`${tmpDirPath}/${zipEntry.entryName}`);

        unzippedFiles.push({
          name: zipEntry.entryName,
          extension: extname(zipEntry.entryName),
          type: acceptableVideoExts.includes(extension) ? 'video' : 'receipt',
          hash: xxhash.hash(file, 0xcafebabe),
        });
      });

      if (!find(unzippedFiles, (o) => o.type === 'video')) {
        return this.returnUnzipError(
          `Zip file does not include a video file of acceptable format. Acceptable formats are: ${acceptableVideoExts.join(
            ', '
          )}`
        );
      }

      if (!find(unzippedFiles, (o) => o.type === 'receipt')) {
        return this.returnUnzipError(
          'Zip file does not include a receipt file in PDF format'
        );
      }

      if (filter(unzippedFiles, (o) => o.type === 'video').length > 1) {
        return this.returnUnzipError(
          'Only one video file may be included in the zip file'
        );
      }

      if (filter(unzippedFiles, (o) => o.type === 'receipt').length > 1) {
        return this.returnUnzipError(
          'Only one receipt file may be included in the zip file'
        );
      }

      if (filter(unzippedFiles, (o) => !o.hash).length > 0) {
        return this.returnUnzipError(
          'Could get get the hash of one or more files from the zip file'
        );
      }

      return {
        unzippedFiles,
        tmpDirPath,
      };
    } catch (e) {
      console.log('unzipFile error:', e);

      return this.returnUnzipError(
        `File included in request could not be unzipped. Be sure to include a zip file with two files included: a video file (in one of ${acceptableVideoExts.join(
          ', '
        )} format) and a receipt file (in PDF format)`
      );
    }
  };

  returnUnzipError = (error: string): string => {
    console.log('error:', error);

    return error;
  };

  deleteFile = async (path: string): Promise<void> => {
    try {
      return new Promise((resolve) => {
        unlink(path, (err) => {
          if (err) {
            console.log('Error deleting file in CreateExpenditure:', err);
          }

          resolve();
        });
      });
    } catch (e) {
      console.log('deleteFile error in CreateExpenditure:', e);
    }
  };

  deleteDirectory = async (path: string): Promise<void> => {
    try {
      return new Promise((resolve) => {
        rimraf(path, () => {
          resolve();
        });
      });
    } catch (e) {
      console.log('Error in deleteDirectory in CreateExpenditure:', e);
    }
  };

  deleteAllTempFiles = async (): Promise<void> => {
    try {
      return new Promise(async (resolve) => {
        const directory = `${__dirname}/tmp`;

        readdir(directory, async (err, files) => {
          if (err) {
            console.log('deleteAllTempFiles readdir error:', err);

            return resolve();
          }

          await Promise.all(
            files.map(async (file) => {
              return new Promise(async (res) => {
                const path = join(directory, file);

                if (lstatSync(path).isDirectory()) {
                  await this.deleteDirectory(path);
                } else {
                  await this.deleteFile(path);
                }

                res();
              });
            })
          );

          resolve();
        });
      });
    } catch (e) {
      console.log('deleteAllTempFiles error:', e);
    }
  };

  sendExpenditureError = async (
    ok: boolean,
    status: number,
    payload?: { [key: string]: any } | null,
    error?: IError | null
  ) => {
    if (this.redis) {
      await this.redis.setIsCreatingExpenditure(false);
    }

    return this.sendResponse(ok, status, payload, error);
  };
}

export default CreateExpenditure;
