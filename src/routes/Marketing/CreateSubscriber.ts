import { Response } from 'express';

import StandardRoute from '../StandardRoute';
import Mailchimp from '../../utils/Mailchimp';

interface ICreateSubscriberReq {
  firstName: string;
  lastName: string;
  email: string;
}

class CreateSubscriber extends StandardRoute {
  public init = async (): Promise<Response> => {
    const standardError = 'The subsriber could not be added to Mailchimp';

    try {
      const body: ICreateSubscriberReq = this.req.body;

      if (!body) {
        return this.sendResponse(false, 400, null, {
          message: 'The request must include a body',
        });
      }

      const { email, firstName, lastName } = body;

      if (!email) {
        return this.sendResponse(false, 400, null, {
          message: 'The request must include an email address',
        });
      }

      if (!firstName) {
        return this.sendResponse(false, 400, null, {
          message: 'The request must include a first name',
        });
      }

      if (!lastName) {
        return this.sendResponse(false, 400, null, {
          message: 'The request must include a last name',
        });
      }

      const mailchimpSubscribeRes = await new Mailchimp().addListMember(
        email,
        firstName,
        lastName
      );

      if (mailchimpSubscribeRes.error || !mailchimpSubscribeRes.ok) {
        return this.sendResponse(false, 400, null, {
          message: mailchimpSubscribeRes.error || standardError,
        });
      }

      return this.sendResponse(true, 200, null, null);
    } catch (e) {
      console.log('CreateSubscriber in routes error:', e);

      return this.sendResponse(false, 500, null, {
        message: standardError,
      });
    }
  };
}

export default CreateSubscriber;
