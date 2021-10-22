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

import { twitter } from '../CTypes/twitter';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';
import { paths } from './paths';

const zodPayload = z.object({
  twitter: z.string(),
  did: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const payload = request.payload as Payload;

  try {
    const claimContents = {
      Twitter: payload.twitter,
    };
    const claim = Claim.fromCTypeAndClaimContents(
      twitter,
      claimContents,
      payload.did,
    );

    const messageBody: ISubmitTerms = {
      content: {
        claim,
        legitimations: [],
        cTypes: [twitter],
      },
      type: MessageBodyType.SUBMIT_TERMS,
    };

    const message = new Message(messageBody, configuration.did, payload.did);
    const encrypted = await encryptMessage(message, payload.did);

    return h.response(encrypted);
  } catch (error) {
    return Boom.boomify(error as Error);
  }
}

export const quoteTwitter: ServerRoute = {
  method: 'POST',
  path: paths.quoteTwitter,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
