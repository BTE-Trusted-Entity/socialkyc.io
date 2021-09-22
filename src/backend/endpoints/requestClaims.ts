import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';

import { IRequestClaimsForCTypes, MessageBodyType } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';

import { email } from '../CTypes/email';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';

const zodPayload = z.object({
  did: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const payload = request.payload as Payload;

  const messageBody: IRequestClaimsForCTypes = {
    content: [{ cTypeHash: email.hash }],
    type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES,
  };

  const message = new Message(messageBody, configuration.did, payload.did);
  const encrypted = await encryptMessage(message, payload.did);

  return h.response(encrypted);
}

export const requestClaims: ServerRoute = {
  method: 'POST',
  path: '/request-claims',
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
