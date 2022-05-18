import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';
import { Claim } from '@kiltprotocol/core';
import { IEncryptedMessage, MessageBodyType } from '@kiltprotocol/types';

import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { emailCType } from './emailCType';

const zodPayload = z.object({
  email: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email quote started');

  const { email } = request.payload as Input;
  const { did, encryptionKeyId } = getSession(request.headers);

  const claimContents = {
    Email: email.trim(),
  };
  const claim = Claim.fromCTypeAndClaimContents(emailCType, claimContents, did);
  logger.debug('Email quote created');

  const output = await encryptMessageBody(encryptionKeyId, {
    content: {
      claim,
      legitimations: [],
      cTypes: [emailCType],
    },
    type: MessageBodyType.SUBMIT_TERMS,
  });

  logger.debug('Email quote completed');
  return h.response(output as Output);
}

export const quoteEmail: ServerRoute = {
  method: 'POST',
  path: paths.email.quote,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
