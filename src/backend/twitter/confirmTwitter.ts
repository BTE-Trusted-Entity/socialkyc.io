import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import {
  getSessionWithDid,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { attestClaim } from '../utilities/attestClaim';
import { tweetsListeners } from './tweets';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter confirmation started');

  const session = getSessionWithDid(request.payload as PayloadWithSession);

  const { did, requestForAttestation } = session;
  if (!requestForAttestation) {
    throw Boom.notFound('requestForAttestation not found');
  }
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
    const attestedMessagePromise = attestClaim(requestForAttestation, did);
    setSession({ ...session, attestedMessagePromise });

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
