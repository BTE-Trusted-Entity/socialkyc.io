import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { CType } from '@kiltprotocol/sdk-js';

import { getSession, setSession } from '../utilities/sessionStorage';

import { paths } from '../endpoints/paths';

import { getTwitterUserId, tweetsListeners } from './tweets';
import { twitterCType } from './twitterCType';

export type Input = Record<string, never>;

export interface Output {
  Twitter: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter confirmation started');

  const session = getSession(request.headers);
  const { claim } = session;

  if (!claim) {
    throw Boom.notFound('Claim not found');
  }
  if (CType.hashToId(claim.cTypeHash) !== twitterCType.$id) {
    throw Boom.notFound('Claim cType mismatch');
  }

  const twitterHandle = claim.contents['Twitter'] as string;
  const id = await getTwitterUserId(twitterHandle);

  const userListeners = tweetsListeners.get(id);
  if (!userListeners) {
    throw Boom.notFound(`Twitter handle not found: ${twitterHandle}`);
  }

  logger.debug('Twitter confirmation waiting for tweet');
  const { confirmation } = userListeners;
  await confirmation.promise;
  setSession({ ...session, confirmed: true });

  return h.response(claim.contents as unknown as Output);
}

export const confirmTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.confirm,
  handler,
};
