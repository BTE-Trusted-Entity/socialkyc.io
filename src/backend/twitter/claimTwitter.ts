import type { IClaim } from '@kiltprotocol/types';
import type { Request, ResponseObject, ServerRoute } from '@hapi/hapi';

import { z } from 'zod';
import { Claim } from '@kiltprotocol/core';

import {
  getSecretForSession,
  getSession,
  getSessionBySecret,
  setSession,
} from '../utilities/sessionStorage';

import { paths } from '../endpoints/paths';

import { makeControlledPromise } from '../utilities/makeControlledPromise';

import { twitterCType } from './twitterCType';
import { tweetsListeners } from './tweets';

const zodPayload = z.object({
  twitterHandle: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<ResponseObject | string> {
  const { logger } = request;
  logger.debug('Twitter claim started');

  const session = getSession(request.headers);

  const { twitterHandle } = request.payload as Input;
  const { sessionId } = session;
  const secret = getSecretForSession(sessionId);

  const claimContents = {
    Twitter: twitterHandle,
  };

  const claim = Claim.fromCTypeAndClaimContents(
    twitterCType,
    claimContents,
    session.did,
  ) as IClaim & { contents: Output };

  const sessionWithSecret = getSessionBySecret(secret);

  setSession({ ...sessionWithSecret, claim });

  const confirmation = makeControlledPromise<void>();
  confirmation.promise.catch((error) => logger.error(error));
  tweetsListeners.set(twitterHandle.toLowerCase(), [secret, confirmation]);
  logger.debug('Tweets listener added');

  return secret as Output;
}

export const claimTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.claim,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
