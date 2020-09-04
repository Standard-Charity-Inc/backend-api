import Printer from 'pdfmake';
import { TFontDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  readdir,
  createWriteStream,
  readFile,
  writeFile,
  readFileSync,
} from 'fs';
import { join, basename, extname } from 'path';
import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import { defaults as requestDefaults } from 'request';
import shortUuid from 'short-uuid';

import { uploadToS3 } from '../s3';
import Config from '../../config';
import { deleteFile } from '..';

const config = Config[Config.env];

class Receipt {
  dollars: number;
  beginTimestamp: number;
  endTimestamp: number;
  walletAddress: string;
  donorName: string;

  /**
   *
   * @param dollars Formatted in dollars and cents
   * @param beginTimestamp in milliseconds
   * @param endTimestamp in milliseconds
   * @param walletAddress Ethereum wallet address
   * @param donorName Name of donor
   */
  constructor(
    dollars: number,
    beginTimestamp: number,
    endTimestamp: number,
    walletAddress: string,
    donorName: string
  ) {
    this.dollars = dollars;
    this.beginTimestamp = beginTimestamp;
    this.endTimestamp = endTimestamp;
    this.walletAddress = walletAddress;
    this.donorName = donorName;
  }

  init = async (): Promise<string | null> => {
    try {
      const printer = await this.getPrinter();

      if (!printer) {
        console.log('Could not get printer in Receipt init');

        return null;
      }

      const docDefinition = await this.getDocumentDefintion();

      if (!docDefinition) {
        console.log('Could not get docDefinition in Receipt init');

        return null;
      }

      const pdf = printer.createPdfKitDocument(docDefinition);

      const fileName = `${shortUuid.generate()}.pdf`;

      const path = `${__dirname}/tmp/${fileName}`;

      const written = await this.writePdf(pdf, path);

      if (!written) {
        console.log('Could not write PDF in Receipt');

        return null;
      }

      const base64Pdf = await this.getBase64(path);

      if (!base64Pdf) {
        console.log('Could not get base64 PDF in Receipt');

        return null;
      }

      const writtenBase64 = await this.writeBase64(path, base64Pdf);

      if (!writtenBase64) {
        console.log('Could not write base64 file for Receipt');

        return null;
      }

      const fileContent = readFileSync(path);

      const bucketKey = `customerReceipts/${fileName}`;

      const uploaded = await uploadToS3(
        bucketKey,
        fileContent,
        'base64',
        'application/pdf'
      );

      if (!uploaded) {
        console.log('Could not upload to S3 in Receipt');

        return null;
      }

      await deleteFile(path);

      return `${config.aws.s3.bucketUrl}/${bucketKey}`;
    } catch (e) {
      console.log('Receipt init error:', e);

      return null;
    }
  };

  getPrinter = async (): Promise<Printer | null> => {
    try {
      return new Promise(async (resolve) => {
        const fonts: TFontDictionary = {
          OpenSans: {},
        };

        const directory = `${__dirname}/fonts/OpenSans`;

        readdir(directory, async (err, files) => {
          if (err) {
            console.log('getPrinter readdir error:', err);

            return resolve(null);
          }

          await Promise.all(
            files.map(async (file) => {
              return new Promise(async (res) => {
                const path = join(directory, file);

                const fontFamilyName = basename(path, extname(path));

                // @ts-ignore
                fonts.OpenSans[fontFamilyName] = path;

                res();
              });
            })
          );

          resolve(new Printer(fonts));
        });
      });
    } catch (e) {
      console.log('getPrinter error in Receipt:', e);

      return null;
    }
  };

  getDocumentDefintion = async (): Promise<TDocumentDefinitions | null> => {
    try {
      const signature = await this.getSignature();

      if (!signature) {
        console.log('Could not get signature in getDocumentDefintion');

        return null;
      }

      return {
        pageSize: 'LETTER',
        defaultStyle: {
          font: 'OpenSans',
        },
        styles: {
          header: {
            fontSize: 20,
            bold: true,
          },
          centered: {
            alignment: 'center',
          },
          subheader: {
            fontSize: 14,
            bold: true,
          },
          small: {
            fontSize: 8,
          },
          normal: {
            fontSize: 12,
          },
          bold: {
            bold: true,
          },
        },
        content: [
          this.getTextRow('501(c)(3) ORGANIZATION DONATION RECEIPT', [
            'header',
            'centered',
          ]),
          this.getTextRow('\n', ['header']),
          this.getTextRow(
            `Date: ${this.getDate(this.beginTimestamp)} to ${this.getDate(
              this.endTimestamp
            )}`,
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(
            'Name of Non-Profit Organization: Standard Charity, Inc.',
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(
            'Mailing address: 88 Greenwich St., Apt. 1509, New York, NY 10006',
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow('EIN: 85-1381002', ['normal']),
          this.getTextRow('\n', ['header']),
          this.getTextRow('Donor Information', ['header', 'centered']),
          this.getTextRow('\n', ['header']),
          this.getTextRow(
            `Thank you for your donation with a value of ${this.dollars} dollars ($${this.dollars}), made to the above-mentioned 501(c)(3) Non-Profit Organization.`,
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(`Donor's Name: ${this.donorName}`, ['normal']),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(
            `Donor's Ethereum Wallet Address: ${this.walletAddress}`,
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow('Donation Description: To feed those in need', [
            'normal',
          ]),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(
            `I, the undersigned representative, declare (or certify, verify, or state) under penalty of perjury under the laws of the United States of America that there were no goods or services provided as part of this donation. Furthermore, as of the date of this receipt the above-mentioned organization is a current and valid 501(c)(3) non-profit organization in accordance with the standards and regulations of the Internal Revenue Service (IRS).`,
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getImageRow(signature, [197, 60]),
          this.getTextRow(`Representative's Signature`, ['normal', 'bold']),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(
            `Date: ${DateTime.local()
              .setZone('America/New_York')
              .toLocaleString(DateTime.DATE_FULL)}`,
            ['normal']
          ),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(`Representative's Name: Gill Chowdhury`, ['normal']),
          this.getTextRow('\n', ['normal']),
          this.getTextRow(`Title: President`, ['normal']),
        ],
      };
    } catch (e) {
      console.log('getDocumentDefintion in Receipt error:', e);

      return null;
    }
  };

  getTextRow = (text: string, style: string[]) => {
    return {
      text,
      style,
    };
  };

  writePdf = (pdf: PDFKit.PDFDocument, path: string): Promise<boolean> => {
    return new Promise((resolve) => {
      pdf.pipe(
        createWriteStream(path)
          .on('error', (e: Error) => {
            console.log('writePdf error:', e);

            resolve(false);
          })
          .on('finish', () => {
            resolve(true);
          })
      );

      pdf.end();
    });
  };

  getBase64 = (path: string): Promise<string | null> => {
    return new Promise((resolve) => {
      readFile(path, 'base64', (err, data) => {
        if (err) {
          console.log('getBase64 Rececipt error:', err);

          return resolve(null);
        }

        resolve(data);
      });
    });
  };

  writeBase64 = (path: string, file: string): Promise<boolean> => {
    return new Promise((resolve) => {
      writeFile(path, file, 'base64', (err) => {
        if (err) {
          console.log('writeBase64 error:', err);

          return resolve(false);
        }

        resolve(true);
      });
    });
  };

  getSignature = async (): Promise<string | null> => {
    try {
      const signature = readFileSync(`${__dirname}/images/signature.png`);

      return `data:image/png;base64,${Buffer.from(signature).toString(
        'base64'
      )}`;
    } catch (e) {
      console.log('getImageDataUrl error:', e);

      return null;
    }
  };

  getImageRow = (imageDataUrl: string, fit: [number, number]) => {
    return {
      image: imageDataUrl,
      fit,
    };
  };

  getDate = (timestampMilli?: number): string => {
    try {
      return DateTime.fromMillis(timestampMilli || new Date().getTime())
        .setZone('America/New_York')
        .toLocaleString(DateTime.DATE_FULL);
    } catch (e) {
      console.log('getDate in Receipt error:', e);

      return '';
    }
  };
}

export default Receipt;
