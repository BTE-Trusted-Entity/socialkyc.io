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

import { dotsamaCType } from './dotsamaCType';
import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSessionWithDid } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  name: z.string(),
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Dotsama quote started');

  const { name, sessionId } = request.payload as Input;
  const { did } = getSessionWithDid({ sessionId });

  try {
    const claimContents = {
      Name: name.trim(),
    };
    const claim = Claim.fromCTypeAndClaimContents(
      dotsamaCType,
      claimContents,
      did,
    );
    logger.debug('Dotsama quote created');

    const output = await encryptMessageBody(did, {
      content: {
        claim,
        legitimations: [],
        cTypes: [dotsamaCType],
      },
      type: MessageBodyType.SUBMIT_TERMS,
    });

    logger.debug('Dotsama quote completed');
    return h.response(output as Output);
  } catch (error) {
    return Boom.boomify(error as Error);
  }
}

export const quoteDotsama: ServerRoute = {
  method: 'POST',
  path: paths.dotsama.quote,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
