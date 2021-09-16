import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { Claim, Quote } from '@kiltprotocol/core';
import { ISubmitTerms, MessageBodyType } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';

import { email } from '../CTypes/email';
import { fullDidPromise } from '../utilities/fullDid';
import { configuration } from '../utilities/configuration';
import { authenticationKeystore } from '../utilities/keystores';

const zodPayload = z.object({
  name: z.string(),
  email: z.string(),
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
      'Full name': payload.name,
      Email: payload.email,
    };
    const claim = Claim.fromCTypeAndClaimContents(
      email,
      claimContents,
      payload.did,
    );

    const quoteContents = {
      attesterDid: configuration.did,
      cTypeHash: email.hash,
      cost: {
        gross: 233,
        net: 23.3,
        tax: { vat: 3.3 },
      },
      currency: 'KILT',
      timeframe: new Date('2021-07-10'),
      termsAndConditions: 'https://www.example.com/terms',
    };

    const quote = await Quote.fromQuoteDataAndIdentity(
      quoteContents,
      await fullDidPromise,
      authenticationKeystore,
    );

    const messageBody: ISubmitTerms = {
      content: {
        claim,
        quote,
        legitimations: [],
        cTypes: [email],
      },
      type: MessageBodyType.SUBMIT_TERMS,
    };

    const message = new Message(messageBody, configuration.did, payload.did);

    return h.response(message);
  } catch (error) {
    return Boom.boomify(error as Error);
  }
}

export const quote: ServerRoute = {
  method: 'POST',
  path: '/quote',
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
