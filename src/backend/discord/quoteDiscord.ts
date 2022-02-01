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

import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSessionWithDid } from '../utilities/sessionStorage';
import { exceptionToError } from '../../frontend/utilities/exceptionToError';
import { paths } from '../endpoints/paths';

import { discordCType } from './discordCType';

const zodPayload = z.object({
  id: z.string(),
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
  logger.debug('Discord quote started');

  const { id, username, sessionId } = request.payload as Input;
  const { did, encryptionKeyId } = getSessionWithDid({ sessionId });

  try {
    const claimContents = {
      'Discord ID': id,
      'Discord username': username,
    };
    const claim = Claim.fromCTypeAndClaimContents(
      discordCType,
      claimContents,
      did,
    );
    logger.debug('Discord quote created');

    const output = await encryptMessageBody(encryptionKeyId, {
      content: {
        claim,
        legitimations: [],
        cTypes: [discordCType],
      },
      type: MessageBodyType.SUBMIT_TERMS,
    });

    logger.debug('Discord quote completed');
    return h.response(output as Output);
  } catch (exception) {
    const error = exceptionToError(exception);

    return Boom.boomify(error);
  }
}

export const quoteDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.quote,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
