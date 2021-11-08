import { IEncryptedMessage } from '@kiltprotocol/types';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { getRequestForAttestation } from '../utilities/requestCache';
import { attestClaim } from '../utilities/attestClaim';
import { tweetsListeners } from './tweets';
import { paths } from '../endpoints/paths';

export const twitterAttestationPromises: Record<
  string,
  Promise<IEncryptedMessage>
> = {};

const zodPayload = z.object({
  key: z.string(),
  did: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter confirmation started');

  const { key, did } = request.payload as Input;

  const requestForAttestation = getRequestForAttestation(key);
  logger.debug('Twitter confirmation found request');

  const username = requestForAttestation.claim.contents['Twitter'] as string;
  if (!tweetsListeners[username]) {
    throw Boom.notFound(`Twitter handle not found: ${username}`);
  }

  try {
    logger.debug('Twitter confirmation waiting for tweet');
    const confirmation = tweetsListeners[username][1];
    await confirmation.promise;
    delete tweetsListeners[username];

    logger.debug('Twitter confirmation attesting');
    twitterAttestationPromises[key] = attestClaim(requestForAttestation, did);

    return h.response(<Output>undefined);
  } catch (error) {
    throw Boom.internal('Confirmation failed', error);
  }
}

export const confirmTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
