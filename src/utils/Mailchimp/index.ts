import mailchimp from '@mailchimp/mailchimp_marketing';
import { find } from 'lodash';

import Config from '../../config';

const config = Config[Config.env];

interface IMailchimpResponse {
  error?: string | null;
  ok: boolean;
}

interface IMailchimpList {
  id: string;
  name: string;
}

class Mailchimp {
  constructor() {
    mailchimp.setConfig({
      apiKey: config.mailchimp.api.apiKey,
      server: config.mailchimp.api.serverPrefix,
    });
  }

  // Docs: https://mailchimp.com/developer/api/marketing/list-members/add-member-to-list/

  addListMember = async (
    email_address: string,
    FNAME: string,
    LNAME: string
  ): Promise<IMailchimpResponse> => {
    try {
      const lists = await this.getAllLists();

      if (!lists) {
        return {
          ok: false,
          error: 'Could not get Mailchimp lists',
        };
      }

      const list = find(lists, (o) => o.name === config.mailchimp.list.name);

      if (!list || !list.id) {
        return {
          ok: false,
          error: `List with name "${config.mailchimp.list.name}" could not be found`,
        };
      }

      const res = await mailchimp.lists.addListMember(list.id, {
        email_address,
        status: 'subscribed',
        merge_fields: {
          FNAME,
          LNAME,
        },
      });

      if (!res || !res.id) {
        return {
          ok: false,
          error: 'The contact could not be subscribed',
        };
      }

      return {
        ok: true,
      };
    } catch (e) {
      console.log('addListMember error in Mailchimp:', e);

      console.log('e.resposne:', e.response.body);

      return {
        ok: false,
        error: 'The contact could not be added',
      };
    }
  };

  getAllLists = async (): Promise<IMailchimpList[] | null> => {
    try {
      const res = await mailchimp.lists.getAllLists();

      if (!res || !res.lists || !Array.isArray(res.lists) || !res.lists[0]) {
        console.log('Could not get lists for Mailchimp');

        return null;
      }

      return res.lists;
    } catch (e) {
      console.log('all lists errpr:', e);

      return null;
    }
  };
}

export default Mailchimp;
