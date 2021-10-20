import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { CType } from '@kiltprotocol/core';
import { IRequestClaimsForCTypes, MessageBodyType } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';

import { email } from '../CTypes/email';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';

const zodPayload = z.object({
  did: z.string(),
  cType: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

const cTypes: Record<string, CType['hash']> = {
  email: email.hash,
  // twitter: twitter.hash,
};

function getCTypeHash(cType: string) {
  const cTypeHash = cTypes[cType];

  if (cTypeHash) {
    return cTypeHash;
  }
  throw Boom.badRequest(`Verification not offered for ${cType} CType`);
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { did, cType } = request.payload as Payload;

  const cTypeHash = getCTypeHash(cType);

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
