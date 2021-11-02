import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { Claim } from '@kiltprotocol/core';
import { ISubmitTerms, MessageBodyType } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';

import { email } from '../CTypes/email';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';
import { paths } from './paths';

const zodPayload = z.object({
  email: z.string(),
  did: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email quote started');

  const payload = request.payload as Payload;

  try {
    const claimContents = {
      Email: payload.email,
    };
    const claim = Claim.fromCTypeAndClaimContents(
      email,
      claimContents,
      payload.did,
    );
    logger.debug('Email quote created');

    const messageBody: ISubmitTerms = {
      content: {
        claim,
        legitimations: [],
        cTypes: [email],
      },
      type: MessageBodyType.SUBMIT_TERMS,
    };

    const message = new Message(messageBody, configuration.did, payload.did);
    const encrypted = await encryptMessage(message, payload.did);

    logger.debug('Email quote completed');
    return h.response(encrypted);
  } catch (error) {
    return Boom.boomify(error as Error);
  }
}

export const quoteEmail: ServerRoute = {
  method: 'POST',
  path: paths.quoteEmail,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
