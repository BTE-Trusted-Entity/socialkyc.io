import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { IRequestClaimsForCTypes, MessageBodyType } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';

import { email } from '../CTypes/email';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';

const zodPayload = z.object({
  did: z.string(),
  ctype: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { did, ctype } = request.payload as Payload;

  let cTypeHash: string | undefined;

  if (ctype === 'email') {
    cTypeHash = email.hash;
  }

  // TODO: uncomment when twitter credential verification is implemented
  // if ((ctype = 'twitter')) {
  //   cTypeHash = twitter.hash;
  // }

  if (!cTypeHash) {
    throw Boom.badRequest('Verification not offered for selected CType');
  }

  // TODO: Handle challenge when new Message interface is available which corresponds with Credential API spec

  const messageBody: IRequestClaimsForCTypes = {
    content: [{ cTypeHash }],
    type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES,
  };

  const message = new Message(messageBody, configuration.did, did);
  const encrypted = await encryptMessage(message, did);

  return h.response(encrypted);
}

export const requestCredential: ServerRoute = {
  method: 'POST',
  path: '/request-credential',
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
