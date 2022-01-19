import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import {
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';

import { paths } from '../endpoints/paths';

import { tweetsListeners } from './tweets';

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

  const session = getSession(request.payload as PayloadWithSession);

  const { requestForAttestation } = session;
  if (!requestForAttestation) {
    throw Boom.notFound('requestForAttestation not found');
  }
  logger.debug('Twitter confirmation found request');

  const username = requestForAttestation.claim.contents['Twitter'] as string;
  const userListeners = tweetsListeners.get(username.toLowerCase());
  if (!userListeners) {
    throw Boom.notFound(`Twitter handle not found: ${username}`);
  }

  try {
    logger.debug('Twitter confirmation waiting for tweet');
    const confirmation = userListeners[1];
    await confirmation.promise;
    tweetsListeners.delete(username.toLowerCase());
    setSession({ ...session, confirmed: true });

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
