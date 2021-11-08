import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { AttestationData, twitterAttestationPromises } from './confirmTwitter';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  key: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = AttestationData;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter attestation started');

  const { key } = request.payload as Input;

  if (!twitterAttestationPromises[key]) {
    throw Boom.notFound(`Key not found: ${key}`);
  }

  try {
    logger.debug('Twitter attestation attesting');
    const response = await twitterAttestationPromises[key];
    delete twitterAttestationPromises[key];

    logger.debug('Twitter attestation completed');
    return h.response(response as Output);
  } catch (error) {
    throw Boom.internal('Attestation failed', error);
  }
}

export const attestationTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.attest,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
