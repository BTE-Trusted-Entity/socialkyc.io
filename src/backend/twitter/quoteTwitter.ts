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
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

import { twitterCType } from './twitterCType';

const zodPayload = z.object({
  username: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter quote started');

  const { username } = request.payload as Input;
  const { did, encryptionKeyId } = getSession(request.headers);

  const claimContents = {
    Twitter: username.trim(),
  };
  const claim = Claim.fromCTypeAndClaimContents(
    twitterCType,
    claimContents,
    did,
  );
  logger.debug('Twitter quote created');

  const output = await encryptMessageBody(encryptionKeyId, {
    content: {
      claim,
      legitimations: [],
      cTypes: [twitterCType],
    },
    type: MessageBodyType.SUBMIT_TERMS,
  });

  logger.debug('Twitter quote completed');
  return h.response(output as Output);
}

export const quoteTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.quote,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
