import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { Claim } from '@kiltprotocol/core';
import { IEncryptedMessage, MessageBodyType } from '@kiltprotocol/types';

import { twitterCType } from './twitterCType';
import { encryptMessageBody } from '../utilities/encryptMessage';
import { paths } from '../endpoints/paths';
import { getSessionWithDid } from '../utilities/sessionStorage';
import { exceptionToError } from '../../frontend/utilities/exceptionToError';

const zodPayload = z.object({
  username: z.string(),
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter quote started');

  const payload = request.payload as Input;
  const { did, encryptionKeyId } = getSessionWithDid(payload);

  try {
    const claimContents = {
      Twitter: payload.username.trim(),
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
  } catch (exception) {
    const error = exceptionToError(exception);

    return Boom.boomify(error);
  }
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
