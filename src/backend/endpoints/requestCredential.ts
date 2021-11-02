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
import { paths } from './paths';

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
  const { logger } = request;
  logger.debug('Request credential started');

  const { did, cType } = request.payload as Payload;

  const cTypeHash = getCTypeHash(cType);
  logger.debug('Request credential CType found');

  // TODO: Handle challenge when new Message interface is available which corresponds with Credential API spec

  const messageBody: IRequestClaimsForCTypes = {
    content: [{ cTypeHash }],
    type: MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES,
  };

  const message = new Message(messageBody, configuration.did, did);
  const encrypted = await encryptMessage(message, did);

  logger.debug('Request credential completed');
  return h.response(encrypted);
}

export const requestCredential: ServerRoute = {
  method: 'POST',
  path: paths.requestCredential,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
