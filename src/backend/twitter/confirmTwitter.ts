import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';

import { getSession, setSession } from '../utilities/sessionStorage';

import { paths } from '../endpoints/paths';

import { tweetsListeners } from './tweets';

export type Input = Record<string, never>;

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter confirmation started');

  const session = getSession(request.headers);

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

  logger.debug('Twitter confirmation waiting for tweet');
  const confirmation = userListeners[1];
  await confirmation.promise;
  tweetsListeners.delete(username.toLowerCase());
  setSession({ ...session, confirmed: true });

  return h.response(<Output>undefined);
}

export const confirmTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.confirm,
  handler,
};
